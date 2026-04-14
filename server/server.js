const { startApiServer } = require("./runtime");
const port = Number(process.env.PORT || 4000);
const host = process.env.HOST || "0.0.0.0";

startApiServer(port, host)
  .then((server) => {
    const address = server.address();
    const activePort = typeof address === "object" && address ? address.port : port;
    const activeHost =
      typeof address === "object" && address && "address" in address ? address.address : host;
    console.log(`Happy Calendar running on http://${activeHost}:${activePort}`);
  })
  .catch((error) => {
    console.error("Failed to initialize database", error);
    process.exit(1);
  });
