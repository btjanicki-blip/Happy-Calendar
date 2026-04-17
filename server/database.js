const mongoose = require("mongoose");

let connectionPromise = null;

function getMongoUrl() {
  return (
    process.env.MONGO_SRV ||
    process.env.MONGODB_URI ||
    process.env.MONGO_URL ||
    "mongodb://127.0.0.1:27017/happy-calendar"
  );
}

function getConnectionOptions() {
  const options = {
    serverSelectionTimeoutMS: 5000,
  };

  if (process.env.NODE_ENV === "test") {
    options.dbName = process.env.MONGO_DB_NAME || `happy-calendar-test-${process.pid}`;
  }

  return options;
}

async function initializeDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(getMongoUrl(), getConnectionOptions());
  }

  try {
    await connectionPromise;
    return mongoose.connection;
  } catch (error) {
    connectionPromise = null;
    throw error;
  }
}

async function closeDatabase() {
  if (mongoose.connection.readyState === 0) {
    connectionPromise = null;
    return;
  }

  await mongoose.disconnect();
  connectionPromise = null;
}

const taskSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },
    calendarId: {
      type: String,
      required: true,
      trim: true,
      default: "default",
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    points: {
      type: Number,
      required: true,
      min: 1,
    },
    completed: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    recurrence: {
      type: String,
      enum: ["none", "daily", "weekly", "monthly"],
      default: "none",
    },
    seriesId: {
      type: String,
      default: null,
      index: true,
    },
  },
  {
    versionKey: false,
  }
);

taskSchema.index({ calendarId: 1, id: 1 }, { unique: true });
taskSchema.index({ calendarId: 1, date: 1, completed: 1 });

const calendarStatsSchema = new mongoose.Schema(
  {
    calendarId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    weeklyGoal: {
      type: Number,
      required: true,
      min: 1,
      default: 100,
    },
  },
  {
    versionKey: false,
  }
);

const Task = mongoose.models.Task || mongoose.model("Task", taskSchema);
const CalendarStats =
  mongoose.models.CalendarStats || mongoose.model("CalendarStats", calendarStatsSchema);

module.exports = {
  CalendarStats,
  Task,
  closeDatabase,
  initializeDatabase,
};
