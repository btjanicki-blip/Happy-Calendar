const { createApp } = require("./server/app");
const { initializeDatabase } = require("./server/database");

let initializationPromise = null;
module.exports = createApp({
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
