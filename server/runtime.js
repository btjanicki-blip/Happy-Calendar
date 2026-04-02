const { initializeDatabase } = require("./database");
const { createApp } = require("./app");

async function startApiServer(port = 0) {
  await initializeDatabase();

  const app = createApp();

  return new Promise((resolve, reject) => {
    const server = app.listen(port, "127.0.0.1", () => {
      resolve(server);
    });

    server.on("error", (error) => {
      reject(error);
    });
  });
}

module.exports = {
  startApiServer,
};
