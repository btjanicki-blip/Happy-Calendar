import { useEffect, useMemo, useState } from "react";
import CalendarView from "../components/CalendarView";
import GamificationPanel from "../components/GamificationPanel";
import TaskCard, { Task } from "../components/TaskCard";
import TaskFilters, { TaskFilter } from "../components/TaskFilters";
import TaskForm, { TaskFormValues } from "../components/TaskForm";
import WeeklyProgress from "../components/WeeklyProgress";
import { fetchJson } from "../lib/api";

interface UserStats {
  weeklyGoal: number;
  weeklyPoints: number;
  currentStreak: number;
  bestStreak: number;
  totalPoints: number;
  totalCompletedTasks: number;
  level: number;
  nextLevelPoints: number;
  badges: Array<{
    id: string;
    label: string;
    description: string;
    earned: boolean;
  }>;
}

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<UserStats>({
    weeklyGoal: 100,
    weeklyPoints: 0,
    currentStreak: 0,
    bestStreak: 0,
    totalPoints: 0,
    totalCompletedTasks: 0,
    level: 1,
    nextLevelPoints: 100,
    badges: [],
  });
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [activeFilter, setActiveFilter] = useState<TaskFilter>("selected");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadData() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const [taskList, statsSnapshot] = await Promise.all([
        fetchJson<Task[]>("/tasks"),
        fetchJson<UserStats>("/stats"),
      ]);

      setTasks(taskList);
      setStats(statsSnapshot);
    } catch (error) {
      setErrorMessage("Unable to load your calendar right now.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const editingTask = useMemo(
    () => tasks.find((task) => task.id === editingTaskId) ?? null,
    [editingTaskId, tasks]
  );

  const filteredTasks = useMemo(() => {
    const today = getTodayDate();

    switch (activeFilter) {
      case "overdue":
        return tasks.filter((task) => !task.completed && task.date < today);
      case "completed":
        return tasks.filter((task) => task.completed);
      case "highPoint":
        return tasks.filter((task) => task.points >= 20);
      case "selected":
      default:
        return tasks.filter((task) => task.date === selectedDate);
    }
  }, [activeFilter, selectedDate, tasks]);

  async function handleCreateTask(values: TaskFormValues) {
    await fetchJson<Task>("/tasks", {
      method: "POST",
      body: JSON.stringify(values),
    });

    await loadData();
  }

  async function handleUpdateTask(values: TaskFormValues) {
    if (!editingTaskId) {
      return;
    }

    await fetchJson<Task>(`/tasks/${editingTaskId}`, {
      method: "PUT",
      body: JSON.stringify(values),
    });

    setEditingTaskId(null);
    await loadData();
  }

  async function handleToggleComplete(taskId: string) {
    const targetTask = tasks.find((task) => task.id === taskId);

    if (!targetTask) {
      return;
    }

    const endpoint = targetTask.completed
      ? `/tasks/${taskId}`
      : `/tasks/${taskId}/complete`;
    const method = targetTask.completed ? "PUT" : "POST";
    const body = targetTask.completed
      ? JSON.stringify({ completed: false })
      : undefined;

    await fetchJson<Task | { success: boolean }>(endpoint, {
      method,
      body,
    });

    await loadData();
  }

  async function handleDeleteTask(taskId: string) {
    await fetchJson<{ success: boolean }>(`/tasks/${taskId}`, {
      method: "DELETE",
    });

    await loadData();
  }

  async function handleSaveGoal(goal: number) {
    const updatedStats = await fetchJson<UserStats>("/stats", {
      method: "PUT",
      body: JSON.stringify({ weeklyGoal: goal }),
    });

    setStats(updatedStats);
  }

  function getTaskPanelTitle() {
    switch (activeFilter) {
      case "overdue":
        return "Overdue tasks";
      case "completed":
        return "Completed tasks";
      case "highPoint":
        return "High-point tasks";
      case "selected":
      default:
        return "Tasks for the day";
    }
  }

  return (
    <main className="min-h-screen bg-app-gradient px-4 py-8 text-inkSoft sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-inkSoft/55">
              Happy Calendar
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-inkSoft">
              Turn your week into a friendly points game.
            </h1>
          </div>
          <div className="rounded-4xl border border-white/70 bg-white/70 px-5 py-4 shadow-soft">
            <p className="text-sm text-inkSoft/65">Focused day</p>
            <p className="text-lg font-semibold">
              {new Date(`${selectedDate}T00:00:00`).toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </header>

        <WeeklyProgress
          weeklyGoal={stats.weeklyGoal}
          weeklyPoints={stats.weeklyPoints}
          onSaveGoal={handleSaveGoal}
        />

        {errorMessage ? (
          <div className="rounded-3xl border border-blushPastel bg-blushPastel/40 px-4 py-3 text-sm font-medium text-inkSoft">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
          <div className="space-y-6">
            <CalendarView
              tasks={tasks}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onToggleComplete={(taskId) => {
                void handleToggleComplete(taskId);
              }}
            />

            <section className="rounded-4xl border border-borderSoft/80 bg-white/90 p-6 shadow-soft">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-inkSoft">{getTaskPanelTitle()}</h2>
                  <p className="text-sm text-inkSoft/65">
                    Switch between your selected day, overdue items, completed wins, and big-ticket tasks.
                  </p>
                </div>
                <span className="rounded-full bg-skyPastel/35 px-4 py-2 text-sm font-semibold text-inkSoft">
                  {filteredTasks.length} shown
                </span>
              </div>

              <div className="mb-4">
                <TaskFilters activeFilter={activeFilter} onChangeFilter={setActiveFilter} />
              </div>

              <div className="space-y-3">
                {isLoading ? (
                  <div className="rounded-3xl border border-dashed border-borderSoft p-6 text-center text-sm text-inkSoft/55">
                    Loading your tasks...
                  </div>
                ) : null}

                {!isLoading && filteredTasks.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-borderSoft p-6 text-center text-sm text-inkSoft/55">
                    No tasks match this filter yet.
                  </div>
                ) : null}

                {filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleComplete={(taskId) => {
                      void handleToggleComplete(taskId);
                    }}
                    onEdit={(taskId) => {
                      setEditingTaskId(taskId);
                    }}
                    onDelete={(taskId) => {
                      void handleDeleteTask(taskId);
                    }}
                  />
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            {editingTask ? (
              <TaskForm
                mode="edit"
                initialValues={{
                  title: editingTask.title,
                  date: editingTask.date,
                  points: editingTask.points,
                  recurrence: editingTask.recurrence,
                }}
                onSubmitTask={handleUpdateTask}
                onCancel={() => setEditingTaskId(null)}
              />
            ) : (
              <TaskForm onSubmitTask={handleCreateTask} />
            )}

            <GamificationPanel
              currentStreak={stats.currentStreak}
              bestStreak={stats.bestStreak}
              level={stats.level}
              totalPoints={stats.totalPoints}
              nextLevelPoints={stats.nextLevelPoints}
              badges={stats.badges}
            />

            <section className="rounded-4xl border border-borderSoft/80 bg-white/90 p-6 shadow-soft">
              <h2 className="text-xl font-semibold text-inkSoft">How scoring works</h2>
              <div className="mt-4 space-y-3 text-sm text-inkSoft/70">
                <div className="rounded-3xl bg-skyPastel/20 p-4">
                  Completed tasks add their point values to this week&apos;s total.
                </div>
                <div className="rounded-3xl bg-blushPastel/25 p-4">
                  Streaks and badges are derived from your real completion history, not manual counters.
                </div>
                <div className="rounded-3xl bg-slate-100 p-4">
                  Tasks can now be edited, filtered, and used to power lightweight gamification loops.
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Dashboard;
