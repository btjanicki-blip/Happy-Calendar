const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const routes = require("./routes");

function getCalendarId(request) {
  const headerValue = request.header("X-Calendar-Id");

  if (typeof headerValue === "string" && headerValue.trim()) {
    return headerValue.trim();
  }

  return "default";
}

function createApp(options = {}) {
  const app = express();
  const clientDistPath = path.join(__dirname, "..", "client", "dist");
  const hasClientBuild = fs.existsSync(clientDistPath);
  const beforeRoutes = options.beforeRoutes ?? [];

  app.use(cors());
  app.use(express.json());
  app.use((request, _response, next) => {
    request.calendarId = getCalendarId(request);
    next();
  });
  beforeRoutes.forEach((middleware) => {
    app.use(middleware);
  });

  app.get("/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.use(routes);

  if (hasClientBuild) {
    app.use(express.static(clientDistPath));

    app.get("*", (request, response, next) => {
      if (request.path.startsWith("/tasks") || request.path.startsWith("/stats")) {
        next();
        return;
      }

      response.sendFile(path.join(clientDistPath, "index.html"));
    });
  }

  return app;
}

module.exports = {
  createApp,
};
