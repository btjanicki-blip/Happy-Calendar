const fs = require("fs");
const path = require("path");
const initSqlJs = require("sql.js");

let sqlInstancePromise = null;
let databasePromise = null;
let database = null;
let poolPromise = null;

const POSTGRES_KEY_MAP = {
  calendarid: "calendarId",
  seriesid: "seriesId",
  weeklygoal: "weeklyGoal",
  weeklypoints: "weeklyPoints",
  currentstreak: "currentStreak",
  beststreak: "bestStreak",
  totalpoints: "totalPoints",
  totalcompletedtasks: "totalCompletedTasks",
  nextlevelpoints: "nextLevelPoints",
  lastid: "lastID",
};

function isPostgresEnabled() {
  return Boolean(process.env.DATABASE_URL);
}

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

function getPostgresSslConfig(connectionString) {
  if (process.env.PGSSLMODE === "disable") {
    return false;
  }

  if (/localhost|127\.0\.0\.1/.test(connectionString)) {
    return false;
  }

  return {
    rejectUnauthorized: false,
  };
}

async function getPool() {
  if (!poolPromise) {
    const { Pool } = require("pg");
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error("DATABASE_URL is required for Postgres mode.");
    }

    poolPromise = Promise.resolve(
      new Pool({
        connectionString,
        ssl: getPostgresSslConfig(connectionString),
      })
    );
  }

  return poolPromise;
}

function toPostgresQuery(query) {
  let parameterIndex = 0;
  return query.replace(/\?/g, () => {
    parameterIndex += 1;
    return `$${parameterIndex}`;
  });
}

function normalizePostgresRow(row) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [POSTGRES_KEY_MAP[key] ?? key, value])
  );
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

async function runSqlJs(query, params = []) {
  const db = await getDatabase();
  const statement = db.prepare(query);
  statement.run(params);
  statement.free();

  const changeRows = db.exec("SELECT changes() AS changes, last_insert_rowid() AS lastID");
  const changeValues = changeRows[0]?.values?.[0] ?? [0, 0];

  await persistDatabase();

  return {
    changes: Number(changeValues[0] ?? 0),
    lastID: Number(changeValues[1] ?? 0),
  };
}

async function runPostgres(query, params = []) {
  const pool = await getPool();
  const result = await pool.query(toPostgresQuery(query), params);

  return {
    changes: Number(result.rowCount ?? 0),
    lastID: 0,
  };
}

async function run(query, params = []) {
  if (isPostgresEnabled()) {
    return runPostgres(query, params);
  }

  return runSqlJs(query, params);
}

async function getSqlJs(query, params = []) {
  const db = await getDatabase();
  const statement = db.prepare(query, params);
  const rows = extractRows(statement);

  return rows[0];
}

async function getPostgres(query, params = []) {
  const pool = await getPool();
  const result = await pool.query(toPostgresQuery(query), params);
  return result.rows[0] ? normalizePostgresRow(result.rows[0]) : undefined;
}

async function get(query, params = []) {
  if (isPostgresEnabled()) {
    return getPostgres(query, params);
  }

  return getSqlJs(query, params);
}

async function allSqlJs(query, params = []) {
  const db = await getDatabase();
  const statement = db.prepare(query, params);

  return extractRows(statement);
}

async function allPostgres(query, params = []) {
  const pool = await getPool();
  const result = await pool.query(toPostgresQuery(query), params);
  return result.rows.map(normalizePostgresRow);
}

async function all(query, params = []) {
  if (isPostgresEnabled()) {
    return allPostgres(query, params);
  }

  return allSqlJs(query, params);
}

async function ensureColumnSqlJs(tableName, columnName, definition) {
  const columns = await all(`PRAGMA table_info(${tableName})`);
  const hasColumn = columns.some((column) => column.name === columnName);

  if (!hasColumn) {
    await run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

async function ensureColumnPostgres(tableName, columnName, definition) {
  const column = await get(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = ? AND column_name = ?`,
    [tableName, columnName.toLowerCase()]
  );

  if (!column) {
    await run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

async function ensureColumn(tableName, columnName, definition) {
  if (isPostgresEnabled()) {
    return ensureColumnPostgres(tableName, columnName, definition);
  }

  return ensureColumnSqlJs(tableName, columnName, definition);
}

async function initializePostgres() {
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
      id INTEGER PRIMARY KEY,
      weeklyGoal INTEGER NOT NULL DEFAULT 100,
      CONSTRAINT user_stats_singleton CHECK (id = 1)
    )
  `);

  await run(
    `INSERT INTO user_stats (id, weeklyGoal)
     VALUES (1, 100)
     ON CONFLICT (id) DO NOTHING`
  );

  await run(`
    CREATE TABLE IF NOT EXISTS calendar_stats (
      calendarId TEXT PRIMARY KEY,
      weeklyGoal INTEGER NOT NULL DEFAULT 100
    )
  `);

  await run(
    `INSERT INTO calendar_stats (calendarId, weeklyGoal)
     SELECT 'default', weeklyGoal FROM user_stats WHERE id = 1
     ON CONFLICT (calendarId) DO NOTHING`
  );

  await run(
    `INSERT INTO calendar_stats (calendarId, weeklyGoal)
     VALUES ('default', 100)
     ON CONFLICT (calendarId) DO NOTHING`
  );
}

async function initializeSqlJs() {
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

  await run(`INSERT OR IGNORE INTO user_stats (id, weeklyGoal) VALUES (1, 100)`);

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

async function initializeDatabase() {
  if (isPostgresEnabled()) {
    return initializePostgres();
  }

  return initializeSqlJs();
}

async function closeDatabase() {
  if (isPostgresEnabled()) {
    if (!poolPromise) {
      return;
    }

    const pool = await poolPromise;
    await pool.end();
    poolPromise = null;
    return;
  }

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
