import { app, BrowserWindow, ipcMain, shell } from "electron";
import { join } from "path";
import { is } from "@electron-toolkit/utils";
import {
  initDb,
  getAllTasks,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
  getTaskHistory,
} from "./db";
import { getDbConfig, saveDbConfig } from "./config";
import type {
  CreateTaskInput,
  UpdateTaskInput,
  ReorderUpdate,
  DbConfig,
} from "../shared/types";

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: "#0f172a",
    titleBarStyle: "hiddenInset",
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
    },
  });

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// DB lifecycle
ipcMain.handle("db:connect", async () => {
  await initDb();
});

ipcMain.handle("db:getConfig", () => getDbConfig());

ipcMain.handle("db:saveConfig", async (_e, config: DbConfig) => {
  saveDbConfig(config);
  await initDb();
});

// Tasks
ipcMain.handle("tasks:getAll", () => getAllTasks());
ipcMain.handle("tasks:create", (_e, data: CreateTaskInput) => createTask(data));
ipcMain.handle("tasks:update", (_e, id: string, data: UpdateTaskInput) =>
  updateTask(id, data),
);
ipcMain.handle("tasks:delete", (_e, id: string) => deleteTask(id));
ipcMain.handle("tasks:reorder", (_e, updates: ReorderUpdate[]) =>
  reorderTasks(updates),
);

// History
ipcMain.handle("history:getByTask", (_e, taskId: string) =>
  getTaskHistory(taskId),
);

// Shell
ipcMain.handle("shell:openExternal", (_e, url: string) =>
  shell.openExternal(url),
);
