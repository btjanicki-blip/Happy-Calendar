const assert = require("node:assert/strict");
const EventEmitter = require("node:events");
const httpMocks = require("node-mocks-http");
const { MongoMemoryServer } = require("mongodb-memory-server");

process.env.NODE_ENV = "test";

const { createApp } = require("../app");
const { CalendarStats, Task, closeDatabase, initializeDatabase } = require("../database");

const app = createApp();

function formatDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

async function resetDatabase() {
  await Promise.all([Task.deleteMany({}), CalendarStats.deleteMany({})]);
}

function sendRequest(method, url, body, calendarId = "default") {
  return new Promise((resolve, reject) => {
    const request = httpMocks.createRequest({
      method,
      url,
      body,
      headers: {
        "content-type": "application/json",
        "x-calendar-id": calendarId,
      },
    });

    const response = httpMocks.createResponse({
      eventEmitter: EventEmitter.EventEmitter,
    });

    response.on("end", () => {
      const raw = response._getData();
      resolve({
        status: response.statusCode,
        body: raw ? JSON.parse(raw) : {},
      });
    });

    app.handle(request, response, (error) => {
      if (error) {
        reject(error);
      }
    });
  });
}

async function runTest(name, callback) {
  try {
    await resetDatabase();
    await callback();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
}

async function main() {
  const mongoServer = await MongoMemoryServer.create({
    instance: {
      dbName: "happy-calendar-test",
      ip: "127.0.0.1",
    },
  });

  process.env.MONGO_SRV = mongoServer.getUri();

  try {
    await initializeDatabase();

    await runTest("POST and PUT /tasks create and edit tasks", async () => {
      const createResponse = await sendRequest("POST", "/tasks", {
        title: "Draft launch email",
        date: "2026-04-01",
        points: 15,
      });

      assert.equal(createResponse.status, 201);
      assert.equal(createResponse.body.title, "Draft launch email");

      const updateResponse = await sendRequest("PUT", `/tasks/${createResponse.body.id}`, {
        title: "Draft launch email v2",
        points: 20,
      });

      assert.equal(updateResponse.status, 200);
      assert.equal(updateResponse.body.title, "Draft launch email v2");
      assert.equal(updateResponse.body.points, 20);
    });

    await runTest("POST /tasks creates recurring series rows", async () => {
      const createResponse = await sendRequest("POST", "/tasks", {
        title: "Stretch",
        date: "2026-04-01",
        points: 5,
        recurrence: "weekly",
      });

      assert.equal(createResponse.status, 201);
      assert.equal(createResponse.body.recurrence, "weekly");
      assert.equal(createResponse.body.createdCount, 12);

      const tasksResponse = await sendRequest("GET", "/tasks");
      const recurringTasks = tasksResponse.body.filter((task) => task.seriesId);
      assert.equal(recurringTasks.length, 12);
    });

    await runTest(
      "POST /tasks/:id/complete and GET /stats return gamification data",
      async () => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const firstTask = await sendRequest("POST", "/tasks", {
          title: "Task one",
          date: formatDateKey(yesterday),
          points: 25,
        });
        const secondTask = await sendRequest("POST", "/tasks", {
          title: "Task two",
          date: formatDateKey(today),
          points: 30,
        });

        await sendRequest("POST", `/tasks/${firstTask.body.id}/complete`, {});
        await sendRequest("POST", `/tasks/${secondTask.body.id}/complete`, {});

        const statsResponse = await sendRequest("GET", "/stats");

        assert.equal(statsResponse.status, 200);
        assert.equal(statsResponse.body.weeklyPoints >= 30, true);
        assert.equal(statsResponse.body.currentStreak >= 2, true);
        assert.equal(statsResponse.body.level >= 1, true);
        assert.equal(Array.isArray(statsResponse.body.badges), true);
      }
    );

    await runTest("PUT /stats persists weekly goal changes", async () => {
      const response = await sendRequest("PUT", "/stats", {
        weeklyGoal: 180,
      });

      assert.equal(response.status, 200);
      assert.equal(response.body.weeklyGoal, 180);

      const statsResponse = await sendRequest("GET", "/stats");
      assert.equal(statsResponse.body.weeklyGoal, 180);
    });

    await runTest("calendar ids isolate task and stats data", async () => {
      await sendRequest(
        "POST",
        "/tasks",
        {
          title: "Private task",
          date: "2026-04-01",
          points: 10,
        },
        "calendar-a"
      );

      const otherCalendarTasks = await sendRequest("GET", "/tasks", undefined, "calendar-b");
      assert.equal(otherCalendarTasks.body.length, 0);

      await sendRequest("PUT", "/stats", { weeklyGoal: 250 }, "calendar-a");
      const firstStats = await sendRequest("GET", "/stats", undefined, "calendar-a");
      const secondStats = await sendRequest("GET", "/stats", undefined, "calendar-b");

      assert.equal(firstStats.body.weeklyGoal, 250);
      assert.equal(secondStats.body.weeklyGoal, 100);
    });
  } finally {
    await closeDatabase();
    await mongoServer.stop();
  }

  if (process.exitCode && process.exitCode !== 0) {
    process.exit(process.exitCode);
  }
}

main().catch(async (error) => {
  console.error(error);
  try {
    await closeDatabase();
  } catch (closeError) {
    console.error(closeError);
  }
  process.exit(1);
});
