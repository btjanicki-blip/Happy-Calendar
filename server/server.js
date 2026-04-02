const { startApiServer } = require("./runtime");
const port = 4000;

startApiServer(port)
  .then((server) => {
    const address = server.address();
    const activePort = typeof address === "object" && address ? address.port : port;
    console.log(`Happy Calendar API running on http://127.0.0.1:${activePort}`);
  })
  .catch((error) => {
    console.error("Failed to initialize database", error);
    process.exit(1);
  });
