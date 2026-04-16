const express = require("express");
const { createApp } = require("./server/app");
const { initializeDatabase } = require("./server/database");

let initializationPromise = null;
const app = express();
const apiApp = createApp({
  beforeRoutes: [
    async (_request, _response, next) => {
      if (!initializationPromise) {
        initializationPromise = initializeDatabase();
      }

      try {
        await initializationPromise;
        next();
      } catch (error) {
        next(error);
      }
    },
  ],
});

app.use(apiApp);

module.exports = app;
