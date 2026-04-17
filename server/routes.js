const express = require("express");
const { CalendarStats, Task } = require("./database");

const router = express.Router();
const RECURRENCE_RULES = ["none", "daily", "weekly", "monthly"];

function createTaskId() {
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createSeriesId() {
  return `series_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getWeekBounds(referenceDate = new Date()) {
  const start = new Date(referenceDate);
  const day = start.getDay();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - day);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return {
    start: formatDateKey(start),
    end: formatDateKey(end),
  };
}

function addRecurrence(dateKey, recurrence, step) {
  const date = new Date(`${dateKey}T00:00:00`);

  if (recurrence === "daily") {
    date.setDate(date.getDate() + step);
  } else if (recurrence === "weekly") {
    date.setDate(date.getDate() + step * 7);
  } else if (recurrence === "monthly") {
    date.setMonth(date.getMonth() + step);
  }

  return formatDateKey(date);
}

function getOccurrenceCount(recurrence) {
  switch (recurrence) {
    case "daily":
      return 14;
    case "weekly":
      return 12;
    case "monthly":
      return 6;
    case "none":
    default:
      return 1;
  }
}

function buildRecurringTasks({ title, date, points, recurrence }) {
  const occurrenceCount = getOccurrenceCount(recurrence);
  const seriesId = recurrence === "none" ? null : createSeriesId();

  return Array.from({ length: occurrenceCount }, (_, index) => ({
    id: createTaskId(),
    title,
    date: addRecurrence(date, recurrence, index),
    points,
    completed: false,
    recurrence,
    seriesId,
  }));
}

async function getWeeklyGoal(calendarId) {
  const stats = await CalendarStats.findOne({ calendarId }).lean();
  return stats?.weeklyGoal ?? 100;
}

async function calculateWeeklyPoints(calendarId) {
  const { start, end } = getWeekBounds();
  const result = await Task.aggregate([
    {
      $match: {
        calendarId,
        completed: true,
        date: {
          $gte: start,
          $lte: end,
        },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$points" },
      },
    },
  ]);

  return result[0]?.total ?? 0;
}

function calculateStreaks(completedDates) {
  const uniqueDates = [...new Set(completedDates)].sort();

  if (uniqueDates.length === 0) {
    return {
      currentStreak: 0,
      bestStreak: 0,
    };
  }

  let currentStreak = 1;
  let bestStreak = 1;

  for (let index = 1; index < uniqueDates.length; index += 1) {
    const previous = new Date(`${uniqueDates[index - 1]}T00:00:00`);
    const current = new Date(`${uniqueDates[index]}T00:00:00`);
    const differenceInDays = Math.round(
      (current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (differenceInDays === 1) {
      currentStreak += 1;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else if (differenceInDays > 1) {
      currentStreak = 1;
    }
  }

  const lastCompletedDate = uniqueDates[uniqueDates.length - 1];
  const today = formatDateKey(new Date());
  const yesterday = formatDateKey(new Date(Date.now() - 1000 * 60 * 60 * 24));

  if (lastCompletedDate !== today && lastCompletedDate !== yesterday) {
    currentStreak = 0;
  }

  return {
    currentStreak,
    bestStreak,
  };
}

function buildBadges({ weeklyPoints, totalCompletedTasks, currentStreak, bestStreak, level }) {
  return [
    {
      id: "first-win",
      label: "First Win",
      description: "Complete your first task.",
      earned: totalCompletedTasks >= 1,
    },
    {
      id: "momentum",
      label: "Momentum",
      description: "Reach a 3-day completion streak.",
      earned: bestStreak >= 3,
    },
    {
      id: "point-sprinter",
      label: "Point Sprinter",
      description: "Earn 50 points in one week.",
      earned: weeklyPoints >= 50,
    },
    {
      id: "level-two",
      label: "Level Two",
      description: "Reach level 2 by stacking points.",
      earned: level >= 2,
    },
    {
      id: "finisher",
      label: "Finisher",
      description: "Complete 10 total tasks.",
      earned: totalCompletedTasks >= 10,
    },
    {
      id: "streak-keeper",
      label: "Streak Keeper",
      description: "Keep a streak alive right now.",
      earned: currentStreak >= 2,
    },
  ];
}

async function buildStatsResponse(calendarId) {
  const [weeklyGoal, weeklyPoints, completedTasks] = await Promise.all([
    getWeeklyGoal(calendarId),
    calculateWeeklyPoints(calendarId),
    Task.find({
      calendarId,
      completed: true,
    })
      .sort({ date: 1 })
      .lean(),
  ]);

  const completedDates = completedTasks.map((task) => task.date);
  const totalPoints = completedTasks.reduce((sum, task) => sum + task.points, 0);
  const totalCompletedTasks = completedTasks.length;
  const { currentStreak, bestStreak } = calculateStreaks(completedDates);
  const level = Math.max(1, Math.floor(totalPoints / 100) + 1);
  const nextLevelPoints = level * 100;
  const badges = buildBadges({
    weeklyPoints,
    totalCompletedTasks,
    currentStreak,
    bestStreak,
    level,
  });

  return {
    weeklyGoal,
    weeklyPoints,
    currentStreak,
    bestStreak,
    totalPoints,
    totalCompletedTasks,
    level,
    nextLevelPoints,
    badges,
  };
}

function normalizeTask(task) {
  return {
    id: task.id,
    title: task.title,
    date: task.date,
    points: task.points,
    completed: Boolean(task.completed),
    recurrence: task.recurrence ?? "none",
    seriesId: task.seriesId ?? null,
    calendarId: task.calendarId,
  };
}

function validateTaskPayload({ title, date, points, recurrence }, response) {
  if (!title || !date || typeof points !== "number" || points < 1) {
    response.status(400).json({ error: "Title, date, and points are required." });
    return false;
  }

  if (recurrence && !RECURRENCE_RULES.includes(recurrence)) {
    response.status(400).json({ error: "Recurrence must be none, daily, weekly, or monthly." });
    return false;
  }

  return true;
}

router.get("/tasks", async (request, response) => {
  try {
    const tasks = await Task.find({ calendarId: request.calendarId })
      .sort({ date: 1, completed: 1 })
      .lean();

    response.json(tasks.map(normalizeTask));
  } catch (error) {
    response.status(500).json({ error: "Unable to fetch tasks." });
  }
});

router.post("/tasks", async (request, response) => {
  const { title, date, points, recurrence = "none" } = request.body;

  if (!validateTaskPayload({ title, date, points, recurrence }, response)) {
    return;
  }

  try {
    const tasksToCreate = buildRecurringTasks({
      title,
      date,
      points,
      recurrence,
    }).map((task) => ({
      ...task,
      calendarId: request.calendarId,
    }));

    await Task.insertMany(tasksToCreate, { ordered: true });

    response.status(201).json({
      ...normalizeTask(tasksToCreate[0]),
      createdCount: tasksToCreate.length,
    });
  } catch (error) {
    response.status(500).json({ error: "Unable to create task." });
  }
});

router.put("/tasks/:id", async (request, response) => {
  const { id } = request.params;
  const { title, date, points, completed, recurrence } = request.body;

  try {
    const existingTask = await Task.findOne({
      id,
      calendarId: request.calendarId,
    }).lean();

    if (!existingTask) {
      response.status(404).json({ error: "Task not found." });
      return;
    }

    if (typeof points === "number" && points < 1) {
      response.status(400).json({ error: "Points must be at least 1." });
      return;
    }

    if (recurrence && !RECURRENCE_RULES.includes(recurrence)) {
      response.status(400).json({ error: "Invalid recurrence value." });
      return;
    }

    const updatedTask = {
      title: title ?? existingTask.title,
      date: date ?? existingTask.date,
      points: points ?? existingTask.points,
      recurrence: recurrence ?? existingTask.recurrence ?? "none",
      seriesId:
        recurrence && recurrence !== "none"
          ? existingTask.seriesId ?? createSeriesId()
          : recurrence === "none"
            ? null
            : existingTask.seriesId ?? null,
      completed: typeof completed === "boolean" ? completed : Boolean(existingTask.completed),
    };

    await Task.updateOne(
      {
        id,
        calendarId: request.calendarId,
      },
      {
        $set: updatedTask,
      }
    );

    response.json(
      normalizeTask({
        ...existingTask,
        ...updatedTask,
      })
    );
  } catch (error) {
    response.status(500).json({ error: "Unable to update task." });
  }
});

router.delete("/tasks/:id", async (request, response) => {
  try {
    const result = await Task.deleteOne({
      id: request.params.id,
      calendarId: request.calendarId,
    });

    if (result.deletedCount === 0) {
      response.status(404).json({ error: "Task not found." });
      return;
    }

    response.json({ success: true });
  } catch (error) {
    response.status(500).json({ error: "Unable to delete task." });
  }
});

router.post("/tasks/:id/complete", async (request, response) => {
  try {
    const task = await Task.findOneAndUpdate(
      {
        id: request.params.id,
        calendarId: request.calendarId,
      },
      {
        $set: {
          completed: true,
        },
      },
      {
        new: true,
        lean: true,
      }
    );

    if (!task) {
      response.status(404).json({ error: "Task not found." });
      return;
    }

    response.json({
      success: true,
      task: normalizeTask(task),
    });
  } catch (error) {
    response.status(500).json({ error: "Unable to complete task." });
  }
});

router.get("/stats", async (request, response) => {
  try {
    response.json(await buildStatsResponse(request.calendarId));
  } catch (error) {
    response.status(500).json({ error: "Unable to fetch stats." });
  }
});

router.put("/stats", async (request, response) => {
  const { weeklyGoal } = request.body;

  if (typeof weeklyGoal !== "number" || weeklyGoal < 1) {
    response.status(400).json({ error: "A valid weeklyGoal is required." });
    return;
  }

  try {
    await CalendarStats.findOneAndUpdate(
      { calendarId: request.calendarId },
      { $set: { weeklyGoal } },
      { upsert: true }
    );

    response.json(await buildStatsResponse(request.calendarId));
  } catch (error) {
    response.status(500).json({ error: "Unable to update stats." });
  }
});

module.exports = router;
