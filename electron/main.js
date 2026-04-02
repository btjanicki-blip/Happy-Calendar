const path = require("path");
const { app, BrowserWindow, dialog, nativeImage } = require("electron");
const { startApiServer } = require("../server/runtime");

let mainWindow = null;
let apiServer = null;

function getAppIconPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "icon.icns");
  }

  return path.join(__dirname, "..", "build", "icon.png");
}

async function createMainWindow() {
  const iconPath = getAppIconPath();
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1100,
    minHeight: 760,
    backgroundColor: "#F7FBFF",
    title: "Happy Calendar",
    autoHideMenuBar: true,
    icon: iconPath,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  apiServer = await startApiServer();
  const address = apiServer.address();
  const port = typeof address === "object" && address ? address.port : 4000;

  await mainWindow.loadURL(`http://127.0.0.1:${port}`);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    app.setName("Happy Calendar");
    app.setAppUserModelId("com.happycalendar.local");
    process.env.HAPPY_CAL_DB_PATH = path.join(
      app.getPath("userData"),
      "happy-calendar.db"
    );
    const iconPath = getAppIconPath();
    if (process.platform === "darwin" && app.dock) {
      app.dock.setIcon(nativeImage.createFromPath(iconPath));
    }

    await createMainWindow();
  } catch (error) {
    console.error("Failed to launch Happy Calendar desktop app", error);
    await dialog.showMessageBox({
      type: "error",
      title: "Happy Calendar",
      message: "The desktop app could not start.",
      detail: error instanceof Error ? error.message : String(error),
    });
    app.quit();
    return;
  }

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow();
    }
  });
});

app.on("window-all-closed", async () => {
  if (apiServer) {
    await new Promise((resolve, reject) => {
      apiServer.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    }).catch((error) => {
      console.error("Failed to stop Happy Calendar API server", error);
    });
    apiServer = null;
  }

  if (process.platform !== "darwin") {
    app.quit();
  }
});
