const assert = require("node:assert/strict");
const EventEmitter = require("node:events");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const httpMocks = require("node-mocks-http");

const databasePath = path.join(os.tmpdir(), `happy-calendar-test-${Date.now()}.db`);
process.env.HAPPY_CAL_DB_PATH = databasePath;

const { createApp } = require("../app");
const { closeDatabase, initializeDatabase, run } = require("../database");

const app = createApp();

function formatDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

async function resetDatabase() {
  await run(`DELETE FROM tasks`);
  await run(`UPDATE user_stats SET weeklyGoal = 100 WHERE id = 1`);
}

function sendRequest(method, url, body) {
  return new Promise((resolve, reject) => {
    const request = httpMocks.createRequest({
      method,
      url,
      body,
      headers: {
        "content-type": "application/json",
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
  await initializeDatabase();

  await runTest("POST and PUT /tasks create and edit tasks", async () => {
    const createResponse = await sendRequest("POST", "/tasks", {
      title: "Draft launch email",
      date: "2026-04-01",
      points: 15,
    });

    assert.equal(createResponse.status, 201);
    assert.equal(createResponse.body.title, "Draft launch email");

    const updateResponse = await sendRequest(
      "PUT",
      `/tasks/${createResponse.body.id}`,
      {
        title: "Draft launch email v2",
        points: 20,
      }
    );

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

  await closeDatabase();

  if (fs.existsSync(databasePath)) {
    fs.rmSync(databasePath, { force: true });
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
  if (fs.existsSync(databasePath)) {
    fs.rmSync(databasePath, { force: true });
  }
  process.exit(1);
});
