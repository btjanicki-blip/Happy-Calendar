const fs = require("fs");
const path = require("path");
const initSqlJs = require("sql.js");

let sqlInstancePromise = null;
let databasePromise = null;
let database = null;

function getDefaultDatabasePath() {
  const persistentDataPath = "/data";

  if (fs.existsSync(persistentDataPath)) {
    return path.join(persistentDataPath, "happy-calendar.db");
  }

  return path.join(__dirname, "happy-calendar.db");
}

function getDatabasePath() {
  return process.env.HAPPY_CAL_DB_PATH || getDefaultDatabasePath();
}

function getSqlInstance() {
  if (!sqlInstancePromise) {
    const wasmBinaryPath = require.resolve("sql.js/dist/sql-wasm.wasm");
    sqlInstancePromise = initSqlJs({
      locateFile: () => wasmBinaryPath,
    });
  }

  return sqlInstancePromise;
}

async function getDatabase() {
  if (database) {
    return database;
  }

  if (!databasePromise) {
    databasePromise = (async () => {
      const SQL = await getSqlInstance();
      const databasePath = getDatabasePath();

      if (fs.existsSync(databasePath)) {
        const fileBuffer = fs.readFileSync(databasePath);
        database = new SQL.Database(fileBuffer);
      } else {
        database = new SQL.Database();
      }

      return database;
    })();
  }

  return databasePromise;
}

async function persistDatabase() {
  const db = await getDatabase();
  const databasePath = getDatabasePath();
  const databaseDirectory = path.dirname(databasePath);

  fs.mkdirSync(databaseDirectory, { recursive: true });
  fs.writeFileSync(databasePath, Buffer.from(db.export()));
}

function extractRows(statement) {
  const rows = [];

  while (statement.step()) {
    rows.push(statement.getAsObject());
  }

  statement.free();
  return rows;
}

async function run(query, params = []) {
  const db = await getDatabase();
  const statement = db.prepare(query);
  statement.run(params);
  statement.free();

  const changeRows = db.exec("SELECT changes() AS changes, last_insert_rowid() AS lastID");
  const changeValues =
    changeRows[0]?.values?.[0] ?? [0, 0];

  await persistDatabase();

  return {
    changes: Number(changeValues[0] ?? 0),
    lastID: Number(changeValues[1] ?? 0),
  };
}

async function get(query, params = []) {
  const db = await getDatabase();
  const statement = db.prepare(query, params);
  const rows = extractRows(statement);

  return rows[0];
}

async function all(query, params = []) {
  const db = await getDatabase();
  const statement = db.prepare(query, params);

  return extractRows(statement);
}

async function ensureColumn(tableName, columnName, definition) {
  const columns = await all(`PRAGMA table_info(${tableName})`);
  const hasColumn = columns.some((column) => column.name === columnName);

  if (!hasColumn) {
    await run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

async function initializeDatabase() {
  await getDatabase();

  await run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      points INTEGER NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0
    )
  `);

  await ensureColumn("tasks", "recurrence", `TEXT NOT NULL DEFAULT 'none'`);
  await ensureColumn("tasks", "seriesId", `TEXT`);
  await ensureColumn("tasks", "calendarId", `TEXT NOT NULL DEFAULT 'default'`);

  await run(`
    CREATE TABLE IF NOT EXISTS user_stats (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      weeklyGoal INTEGER NOT NULL DEFAULT 100
    )
  `);

  await run(
    `INSERT OR IGNORE INTO user_stats (id, weeklyGoal) VALUES (1, 100)`
  );

  await run(`
    CREATE TABLE IF NOT EXISTS calendar_stats (
      calendarId TEXT PRIMARY KEY,
      weeklyGoal INTEGER NOT NULL DEFAULT 100
    )
  `);

  await run(
    `INSERT OR IGNORE INTO calendar_stats (calendarId, weeklyGoal)
     SELECT 'default', weeklyGoal FROM user_stats WHERE id = 1`
  );

  await run(
    `INSERT OR IGNORE INTO calendar_stats (calendarId, weeklyGoal) VALUES ('default', 100)`
  );
}

async function closeDatabase() {
  if (!database) {
    return;
  }

  await persistDatabase();
  database.close();
  database = null;
  databasePromise = null;
}

module.exports = {
  all,
  closeDatabase,
  db: null,
  get,
  initializeDatabase,
  run,
};
