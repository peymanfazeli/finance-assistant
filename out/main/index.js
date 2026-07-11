"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const electron = require("electron");
const path = require("path");
const fs = require("fs");
const is = {
  dev: !electron.app.isPackaged
};
const platform = {
  isWindows: process.platform === "win32",
  isMacOS: process.platform === "darwin",
  isLinux: process.platform === "linux"
};
const electronApp = {
  setAppUserModelId(id) {
    if (platform.isWindows)
      electron.app.setAppUserModelId(is.dev ? process.execPath : id);
  },
  setAutoLaunch(auto) {
    if (platform.isLinux)
      return false;
    const isOpenAtLogin = () => {
      return electron.app.getLoginItemSettings().openAtLogin;
    };
    if (isOpenAtLogin() !== auto) {
      electron.app.setLoginItemSettings({ openAtLogin: auto });
      return isOpenAtLogin() === auto;
    } else {
      return true;
    }
  },
  skipProxy() {
    return electron.session.defaultSession.setProxy({ mode: "direct" });
  }
};
const optimizer = {
  watchWindowShortcuts(window, shortcutOptions) {
    if (!window)
      return;
    const { webContents } = window;
    const { escToCloseWindow = false, zoom = false } = shortcutOptions || {};
    webContents.on("before-input-event", (event, input) => {
      if (input.type === "keyDown") {
        if (!is.dev) {
          if (input.code === "KeyR" && (input.control || input.meta))
            event.preventDefault();
          if (input.code === "KeyI" && (input.alt && input.meta || input.control && input.shift)) {
            event.preventDefault();
          }
        } else {
          if (input.code === "F12") {
            if (webContents.isDevToolsOpened()) {
              webContents.closeDevTools();
            } else {
              webContents.openDevTools({ mode: "undocked" });
              console.log("Open dev tool...");
            }
          }
        }
        if (escToCloseWindow) {
          if (input.code === "Escape" && input.key !== "Process") {
            window.close();
            event.preventDefault();
          }
        }
        if (!zoom) {
          if (input.code === "Minus" && (input.control || input.meta))
            event.preventDefault();
          if (input.code === "Equal" && input.shift && (input.control || input.meta))
            event.preventDefault();
        }
      }
    });
  },
  registerFramelessWindowIpc() {
    electron.ipcMain.on("win:invoke", (event, action) => {
      const win = electron.BrowserWindow.fromWebContents(event.sender);
      if (win) {
        if (action === "show") {
          win.show();
        } else if (action === "showInactive") {
          win.showInactive();
        } else if (action === "min") {
          win.minimize();
        } else if (action === "max") {
          const isMaximized = win.isMaximized();
          if (isMaximized) {
            win.unmaximize();
          } else {
            win.maximize();
          }
        } else if (action === "close") {
          win.close();
        }
      }
    });
  }
};
const SCHEMA_VERSION = 2;
class DatasetService {
  static create(name, currency, categories, receivables = [], transactions = []) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    return {
      version: SCHEMA_VERSION,
      name,
      currency,
      createdAt: now,
      updatedAt: now,
      transactions,
      categories,
      receivables
    };
  }
  static serialize(dataset) {
    dataset.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    return JSON.stringify(dataset, null, 2);
  }
  static deserialize(content) {
    const data = JSON.parse(content);
    if (data.currency === "IRR") data.currency = "toman";
    if (!data.version) {
      throw new Error("Invalid dataset file: missing version field");
    }
    if (!data.receivables) {
      data.receivables = [];
    }
    return data;
  }
}
function generateId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : r & 3 | 8;
    return v.toString(16);
  });
}
const DEFAULT_CATEGORIES = [
  { name: "Food & Drinks", color: "#FF6B6B", icon: "🍵🥪", isDefault: true },
  { name: "Transportation", color: "#DDA0DD", icon: "🚌", isDefault: true },
  { name: "Car purchases", color: "#DDA0DD", icon: "🚗", isDefault: true },
  { name: "Internet", color: "#F5C88B", icon: "🛜", isDefault: true },
  { name: "Shopping", color: "#FF0909", icon: "🛍️", isDefault: true },
  { name: "House purchases", color: "#FF0909", icon: "🏠", isDefault: true },
  { name: "Education", color: "#BAE9FC", icon: "school", isDefault: true },
  { name: "Software & Subscriptions", color: "#EEB04C", icon: "💻", isDefault: true },
  { name: "Bills", color: "#FFA99B", icon: "🧾", isDefault: true },
  { name: "Investment", color: "#A1F9B0", icon: "💰", isDefault: true },
  { name: "Project", color: "#1BF13F", icon: "🧑‍💻", isDefault: true },
  { name: "Salary", color: "#1BF13F", icon: "💵", isDefault: true },
  { name: "MustNot", color: "#C7C7C7", icon: "❌", isDefault: true },
  { name: "Bullshit", color: "#BDC3C7", icon: "💩", isDefault: true }
];
class CategoryService {
  static createDefaultCategories() {
    return DEFAULT_CATEGORIES.map((cat) => ({
      ...cat,
      id: generateId(),
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    }));
  }
  static create(categories, name, color, icon) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newCategory = {
      id: generateId(),
      name,
      color,
      icon,
      isDefault: false,
      createdAt: now
    };
    return [...categories, newCategory];
  }
  static update(categories, id, updates) {
    return categories.map((cat) => cat.id === id ? { ...cat, ...updates } : cat);
  }
  static delete(categories, id) {
    const category = categories.find((c) => c.id === id);
    if (!category) {
      return { updatedCategories: categories, deletedCategory: null };
    }
    if (category.isDefault) {
      throw new Error("Cannot delete default categories");
    }
    return {
      updatedCategories: categories.filter((c) => c.id !== id),
      deletedCategory: category
    };
  }
  static findById(categories, id) {
    return categories.find((c) => c.id === id);
  }
}
function cleanupTempFiles() {
  try {
    const userDataPath = electron.app.getPath("userData");
    const dirs = [userDataPath, process.cwd()];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir);
      for (const f of files) {
        if (f.endsWith(".tmp")) {
          try {
            fs.unlinkSync(path.join(dir, f));
          } catch {
          }
        }
      }
    }
  } catch {
  }
}
function registerDatasetHandlers() {
  electron.ipcMain.handle("dataset:save", async (_event, filePath, content) => {
    try {
      const dir = path.dirname(path.resolve(filePath));
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const tmpPath = filePath + ".tmp";
      fs.writeFileSync(tmpPath, content, "utf-8");
      fs.renameSync(tmpPath, filePath);
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });
  electron.ipcMain.handle("dataset:load", async (_event, filePath) => {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const dataset = DatasetService.deserialize(content);
      return { success: true, data: dataset };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });
  electron.ipcMain.handle("dialog:save", async () => {
    const result = await electron.dialog.showSaveDialog({
      filters: [{ name: "Finance Dataset", extensions: ["fina", "json"] }]
    });
    return result;
  });
  electron.ipcMain.handle("dataset:createDefault", async () => {
    try {
      const datasetsDir = path.join(electron.app.getPath("userData"), "datasets");
      if (!fs.existsSync(datasetsDir)) {
        fs.mkdirSync(datasetsDir, { recursive: true });
      }
      const defaultPath = path.join(datasetsDir, "default.fina");
      const categories = CategoryService.createDefaultCategories();
      const dataset = DatasetService.create("My Finances", "USD", categories);
      const content = DatasetService.serialize(dataset);
      const tmpPath = defaultPath + ".tmp";
      fs.writeFileSync(tmpPath, content, "utf-8");
      fs.renameSync(tmpPath, defaultPath);
      return { success: true, path: defaultPath };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });
  electron.ipcMain.handle("dataset:createNamed", async (_event, name, currency, categories, receivables, transactions) => {
    try {
      const datasetsDir = path.join(electron.app.getPath("userData"), "datasets");
      if (!fs.existsSync(datasetsDir)) {
        fs.mkdirSync(datasetsDir, { recursive: true });
      }
      const sanitized = name.replace(/[^a-zA-Z0-9_\- ]/g, "").trim().replace(/\s+/g, "_") || "dataset";
      const filePath = path.join(datasetsDir, `${sanitized}.fina`);
      const cats = categories ?? CategoryService.createDefaultCategories();
      const dataset = DatasetService.create(name, currency, cats, receivables, transactions);
      const content = DatasetService.serialize(dataset);
      const tmpPath = filePath + ".tmp";
      fs.writeFileSync(tmpPath, content, "utf-8");
      fs.renameSync(tmpPath, filePath);
      return { success: true, path: filePath };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });
  electron.ipcMain.handle("dialog:open", async () => {
    const result = await electron.dialog.showOpenDialog({
      filters: [{ name: "Finance Dataset", extensions: ["fina", "json"] }],
      properties: ["openFile"]
    });
    return result;
  });
}
var Language = /* @__PURE__ */ ((Language2) => {
  Language2["En"] = "en";
  Language2["Fa"] = "fa";
  return Language2;
})(Language || {});
const SETTINGS_VERSION = 1;
const defaultSettings = {
  language: Language.En,
  visibleDashboardCards: [
    "totalIncome",
    "totalExpenses",
    "netBalance",
    "transactionCount",
    "avgDailySpending",
    "avgWeeklySpending"
  ],
  lastOpenedDataset: null,
  recentDatasets: []
};
class SettingsService {
  static createDefault() {
    return { ...defaultSettings };
  }
  static serialize(settings) {
    return JSON.stringify({ ...settings, settingsVersion: SETTINGS_VERSION }, null, 2);
  }
  static deserialize(content) {
    const data = JSON.parse(content);
    if (data.settingsVersion == null) {
      throw new Error("Invalid settings file: missing settingsVersion field");
    }
    const validated = {
      language: Object.values(Language).includes(data.language) ? data.language : Language.En,
      visibleDashboardCards: Array.isArray(data.visibleDashboardCards) ? data.visibleDashboardCards : defaultSettings.visibleDashboardCards,
      lastOpenedDataset: typeof data.lastOpenedDataset === "string" ? data.lastOpenedDataset : null,
      recentDatasets: Array.isArray(data.recentDatasets) ? data.recentDatasets : []
    };
    return validated;
  }
  static validate(settings) {
    if (!settings || typeof settings !== "object") return false;
    const s = settings;
    return Object.values(Language).includes(s.language) && Array.isArray(s.visibleDashboardCards) && (s.lastOpenedDataset === null || typeof s.lastOpenedDataset === "string") && Array.isArray(s.recentDatasets);
  }
}
function getSettingsPath$1() {
  return `${electron.app.getPath("userData")}/settings.json`;
}
function writeAtomic(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tmpPath = filePath + ".tmp";
  fs.writeFileSync(tmpPath, content, "utf-8");
  fs.renameSync(tmpPath, filePath);
}
function registerSettingsHandlers() {
  electron.ipcMain.handle("settings:load", async () => {
    try {
      const settingsPath = getSettingsPath$1();
      if (!fs.existsSync(settingsPath)) {
        return { success: true, data: null };
      }
      const content = fs.readFileSync(settingsPath, "utf-8");
      const settings = SettingsService.deserialize(content);
      return { success: true, data: settings };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });
  electron.ipcMain.handle("settings:save", async (_event, content) => {
    try {
      writeAtomic(getSettingsPath$1(), content);
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });
}
function registerFileHandlers() {
  electron.ipcMain.handle("file:read", async (_event, filePath) => {
    try {
      const buffer = fs.readFileSync(filePath);
      const ext = filePath.toLowerCase().split(".").pop() || "";
      return {
        success: true,
        data: buffer.toString("base64"),
        ext
      };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });
  electron.ipcMain.handle("dialog:openFile", async () => {
    const result = await electron.dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [
        { name: "Spreadsheets", extensions: ["xlsx", "xls", "csv"] }
      ]
    });
    return result;
  });
}
function registerExportHandlers() {
  electron.ipcMain.handle("export:saveFile", async (_event, filePath, content) => {
    try {
      const dir = path.dirname(path.resolve(filePath));
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, content, "utf-8");
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });
  electron.ipcMain.handle("export:saveFileBinary", async (_event, filePath, base64) => {
    try {
      const dir = path.dirname(path.resolve(filePath));
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const buffer = Buffer.from(base64, "base64");
      fs.writeFileSync(filePath, buffer);
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });
  electron.ipcMain.handle("dialog:saveExport", async (_event, defaultName, filters) => {
    const result = await electron.dialog.showSaveDialog({
      defaultPath: defaultName,
      filters
    });
    return result;
  });
}
let closeRequested = false;
function getSettingsPath() {
  return `${electron.app.getPath("userData")}/settings.json`;
}
function registerCloseHandlers(mainWindow2) {
  electron.ipcMain.handle("export:get-last-timestamp", async () => {
    try {
      const settingsPath = getSettingsPath();
      if (!fs.existsSync(settingsPath)) {
        return { timestamp: null };
      }
      const content = fs.readFileSync(settingsPath, "utf-8");
      const settings = SettingsService.deserialize(content);
      return { timestamp: settings.lastExportTimestamp ?? null };
    } catch {
      return { timestamp: null };
    }
  });
  electron.ipcMain.handle("export:save-last-timestamp", async (_event, timestamp) => {
    try {
      const settingsPath = getSettingsPath();
      const content = fs.readFileSync(settingsPath, "utf-8");
      const settings = SettingsService.deserialize(content);
      settings.lastExportTimestamp = timestamp;
      const { writeFileSync, renameSync, mkdirSync } = require("fs");
      const { dirname } = require("path");
      const dir = dirname(settingsPath);
      if (!fs.existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      const tmpPath = settingsPath + ".tmp";
      writeFileSync(tmpPath, JSON.stringify(settings, null, 2), "utf-8");
      renameSync(tmpPath, settingsPath);
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  });
  electron.ipcMain.handle("app:confirm-close", async () => {
    closeRequested = true;
    if (mainWindow2 && !mainWindow2.isDestroyed()) {
      mainWindow2.close();
    } else {
      electron.app.quit();
    }
  });
  electron.ipcMain.handle("app:cancel-close", async () => {
    closeRequested = false;
    return { success: true };
  });
  mainWindow2.on("close", (e) => {
    if (!closeRequested) {
      e.preventDefault();
      mainWindow2.webContents.send("app:will-close");
    }
  });
}
function getConfigsDir() {
  if (is.dev) {
    return path.join(process.cwd(), "src", "Configs");
  }
  return path.join(electron.app.getAppPath(), "src", "Configs");
}
function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9_\- ]/g, "").trim().replace(/\s+/g, "_") || "dataset";
}
function getDefaultCatPath() {
  return path.join(getConfigsDir(), "def_cat.ts");
}
function getDefaultRecievPath() {
  return path.join(getConfigsDir(), "def_reciev.ts");
}
function getDatasetCatPath(datasetName) {
  return path.join(getConfigsDir(), `${sanitizeFileName(datasetName)}_cat.ts`);
}
function getDatasetRecievPath(datasetName) {
  return path.join(getConfigsDir(), `${sanitizeFileName(datasetName)}_reciev.ts`);
}
function buildReceivablesFileContent(receivables) {
  const entries = receivables.map(
    (r) => `  { title: ${JSON.stringify(r.title)}, category: ${JSON.stringify(r.category)}, totalAmount: ${r.totalAmount}, from: ${JSON.stringify(r.from)}, notes: ${JSON.stringify(r.notes)} }`
  ).join(",\n");
  return `export interface ReceivableConfig {
  title: string
  category: string
  totalAmount: number
  from: string
  notes: string
}

export const DEFAULT_RECEIVABLES: ReceivableConfig[] = [
${entries}
]
`;
}
function buildCategoriesFileContent(categories) {
  const entries = categories.map(
    (c) => `    { name: ${JSON.stringify(c.name)}, color: ${JSON.stringify(c.color)}, icon: ${JSON.stringify(c.icon)}, isDefault: ${c.isDefault} }`
  ).join(",\n");
  return `import { Category } from '../core/models/types'
export const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'createdAt'>[] = [
${entries}
  ]
`;
}
function writeAtomically(filePath, content) {
  const tmpPath = filePath + ".tmp";
  fs.writeFileSync(tmpPath, content, "utf-8");
  const { renameSync } = require("fs");
  renameSync(tmpPath, filePath);
}
function parseConfigArray(content) {
  const bracketStart = content.indexOf("[");
  const bracketEnd = content.lastIndexOf("]");
  if (bracketStart === -1 || bracketEnd === -1) return [];
  const body = content.slice(bracketStart + 1, bracketEnd);
  const entries = [];
  let depth = 0;
  let current = "";
  for (const ch of body) {
    if (ch === "{") {
      depth++;
      current += ch;
    } else if (ch === "}") {
      depth--;
      current += ch;
      if (depth === 0) {
        entries.push(current);
        current = "";
      }
    } else if (depth > 0) {
      current += ch;
    }
  }
  return entries;
}
function extractField(entry, field) {
  const m = entry.match(new RegExp(`${field}:\\s*["']([^"']*)["']`));
  return m ? m[1] : "";
}
function extractNumber(entry, field) {
  const m = entry.match(new RegExp(`${field}:\\s*(\\d+)`));
  return m ? parseInt(m[1], 10) : 0;
}
function extractBool(entry, field) {
  const m = entry.match(new RegExp(`${field}:\\s*(true|false)`));
  return m ? m[1] === "true" : false;
}
function registerConfigHandlers() {
  electron.ipcMain.handle(
    "config:createDatasetConfigs",
    async (_event, datasetName) => {
      try {
        const configsDir = getConfigsDir();
        if (!fs.existsSync(configsDir)) {
          fs.mkdirSync(configsDir, { recursive: true });
        }
        const catPath = getDatasetCatPath(datasetName);
        const recievPath = getDatasetRecievPath(datasetName);
        const defaultCat = getDefaultCatPath();
        const defaultReciev = getDefaultRecievPath();
        if (!fs.existsSync(catPath) && fs.existsSync(defaultCat)) {
          fs.writeFileSync(catPath, fs.readFileSync(defaultCat, "utf-8"), "utf-8");
        }
        if (!fs.existsSync(recievPath) && fs.existsSync(defaultReciev)) {
          fs.writeFileSync(recievPath, fs.readFileSync(defaultReciev, "utf-8"), "utf-8");
        }
        return { success: true, catPath, recievPath };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    }
  );
  electron.ipcMain.handle(
    "config:syncReceivables",
    async (_event, datasetName, receivables) => {
      try {
        const filePath = getDatasetRecievPath(datasetName);
        const content = buildReceivablesFileContent(receivables);
        writeAtomically(filePath, content);
        return { success: true };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    }
  );
  electron.ipcMain.handle(
    "config:syncCategories",
    async (_event, datasetName, categories) => {
      try {
        const filePath = getDatasetCatPath(datasetName);
        const content = buildCategoriesFileContent(categories);
        writeAtomically(filePath, content);
        return { success: true };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    }
  );
  electron.ipcMain.handle(
    "config:readConfigForImport",
    async (_event, csvBaseName) => {
      try {
        const configsDir = getConfigsDir();
        let catPath = path.join(configsDir, `${csvBaseName}_cat.ts`);
        let recievPath = path.join(configsDir, `${csvBaseName}_reciev.ts`);
        let source = csvBaseName;
        if (!fs.existsSync(catPath)) {
          catPath = getDefaultCatPath();
          source = "def";
        }
        if (!fs.existsSync(recievPath)) {
          recievPath = getDefaultRecievPath();
          source = fs.existsSync(path.join(configsDir, `${csvBaseName}_cat.ts`)) ? csvBaseName : "def";
        }
        const categories = [];
        if (fs.existsSync(catPath)) {
          const catContent = fs.readFileSync(catPath, "utf-8");
          for (const entry of parseConfigArray(catContent)) {
            categories.push({
              name: extractField(entry, "name"),
              color: extractField(entry, "color"),
              icon: extractField(entry, "icon"),
              isDefault: extractBool(entry, "isDefault")
            });
          }
        }
        const receivables = [];
        if (fs.existsSync(recievPath)) {
          const recContent = fs.readFileSync(recievPath, "utf-8");
          for (const entry of parseConfigArray(recContent)) {
            receivables.push({
              title: extractField(entry, "title"),
              category: extractField(entry, "category"),
              totalAmount: extractNumber(entry, "totalAmount"),
              from: extractField(entry, "from"),
              notes: extractField(entry, "notes")
            });
          }
        }
        return { success: true, categories, receivables, source };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    }
  );
}
const LABELS = {
  en: {
    file: "File",
    edit: "Edit",
    view: "View",
    help: "Help",
    openDataset: "Open Dataset",
    aboutApp: "About Finance Assistant"
  },
  fa: {
    file: "پرونده",
    edit: "ویرایش",
    view: "نمایش",
    help: "راهنما",
    openDataset: "باز کردن مجموعه داده",
    aboutApp: "درباره دستیار مالی"
  }
};
function buildMenu(lang) {
  const l = LABELS[lang] || LABELS.en;
  const isMac = process.platform === "darwin";
  const template = [
    ...isMac ? [{
      label: electron.app.name,
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "quit" }
      ]
    }] : [],
    {
      label: l.file,
      submenu: [
        {
          label: l.openDataset,
          accelerator: "CmdOrCtrl+O",
          click: async () => {
            const win = electron.BrowserWindow.getFocusedWindow();
            if (win) win.webContents.send("menu:open");
          }
        },
        { type: "separator" },
        isMac ? { role: "close" } : { role: "quit" }
      ]
    },
    {
      label: l.edit,
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" }
      ]
    },
    {
      label: l.view,
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" }
      ]
    },
    {
      label: l.help,
      submenu: [
        {
          label: l.aboutApp,
          click: () => {
            const win = electron.BrowserWindow.getFocusedWindow();
            if (win) win.webContents.send("menu:about");
          }
        }
      ]
    }
  ];
  const menu = electron.Menu.buildFromTemplate(template);
  electron.Menu.setApplicationMenu(menu);
}
function createAppMenu() {
  buildMenu("en");
}
function registerMenuHandlers() {
  electron.ipcMain.handle("menu:updateLanguage", async (_event, lang) => {
    buildMenu(lang);
    return { success: true };
  });
}
function createWindow() {
  mainWindow = new electron.BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    title: "Finance Assistant",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false
    }
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
function getLogPath() {
  return `${electron.app.getPath("userData")}/logs/error.log`;
}
function ensureLogDir() {
  const logDir = `${electron.app.getPath("userData")}/logs`;
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
}
function writeErrorLog(context, message) {
  try {
    ensureLogDir();
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    fs.appendFileSync(getLogPath(), `[${timestamp}] ERROR [${context}]: ${message}
`, "utf-8");
  } catch {
  }
}
let mainWindow = null;
let isQuitting = false;
let pendingSaves = 0;
function notifySaveStarted() {
  pendingSaves++;
}
function notifySaveCompleted() {
  pendingSaves--;
}
electron.app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.finance.assistant");
  cleanupTempFiles();
  registerDatasetHandlers();
  registerSettingsHandlers();
  registerFileHandlers();
  registerExportHandlers();
  registerConfigHandlers();
  createAppMenu();
  registerMenuHandlers();
  electron.ipcMain.handle("log:error", async (_event, context, message) => {
    writeErrorLog(context, message);
    return { success: true };
  });
  electron.ipcMain.handle("app:saveStarted", async () => {
    notifySaveStarted();
    return { success: true };
  });
  electron.ipcMain.handle("app:saveCompleted", async () => {
    notifySaveCompleted();
    return { success: true };
  });
  electron.app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });
  createWindow();
  registerCloseHandlers(mainWindow);
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
electron.app.on("before-quit", (event) => {
  if (!isQuitting && pendingSaves > 0) {
    isQuitting = true;
    event.preventDefault();
    const maxWait = 5e3;
    const start = Date.now();
    const check = () => {
      if (pendingSaves <= 0 || Date.now() - start > maxWait) {
        isQuitting = false;
        electron.app.quit();
      } else {
        setTimeout(check, 50);
      }
    };
    check();
  }
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
exports.notifySaveCompleted = notifySaveCompleted;
exports.notifySaveStarted = notifySaveStarted;
