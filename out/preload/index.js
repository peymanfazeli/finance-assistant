"use strict";
const electron = require("electron");
const api = {
  send: (channel, ...args) => {
    electron.ipcRenderer.send(channel, ...args);
  },
  invoke: (channel, ...args) => {
    return electron.ipcRenderer.invoke(channel, ...args);
  },
  on: (channel, callback) => {
    electron.ipcRenderer.on(channel, (_event, ...args) => callback(...args));
  },
  receive: (channel, callback) => {
    const handler = (_event, ...args) => callback(...args);
    electron.ipcRenderer.on(channel, handler);
    return () => {
      electron.ipcRenderer.removeListener(channel, handler);
    };
  },
  removeAllListeners: (channel) => {
    electron.ipcRenderer.removeAllListeners(channel);
  },
  dataset: {
    save: (filePath, content) => electron.ipcRenderer.invoke("dataset:save", filePath, content),
    load: (filePath) => electron.ipcRenderer.invoke("dataset:load", filePath),
    createDefault: () => electron.ipcRenderer.invoke("dataset:createDefault"),
    showSaveDialog: () => electron.ipcRenderer.invoke("dialog:save"),
    showOpenDialog: () => electron.ipcRenderer.invoke("dialog:open")
  },
  settings: {
    load: () => electron.ipcRenderer.invoke("settings:load"),
    save: (content) => electron.ipcRenderer.invoke("settings:save", content)
  },
  file: {
    read: (filePath) => electron.ipcRenderer.invoke("file:read", filePath),
    openDialog: () => electron.ipcRenderer.invoke("dialog:openFile")
  },
  menu: {
    updateLanguage: (lang) => electron.ipcRenderer.invoke("menu:updateLanguage", lang)
  },
  export: {
    saveFile: (filePath, content) => electron.ipcRenderer.invoke("export:saveFile", filePath, content),
    saveFileBinary: (filePath, base64) => electron.ipcRenderer.invoke("export:saveFileBinary", filePath, base64),
    showSaveDialog: (defaultName, filters) => electron.ipcRenderer.invoke("dialog:saveExport", defaultName, filters),
    getLastExportTimestamp: () => electron.ipcRenderer.invoke("export:get-last-timestamp"),
    saveLastExportTimestamp: (timestamp) => electron.ipcRenderer.invoke("export:save-last-timestamp", timestamp),
    confirmClose: () => electron.ipcRenderer.invoke("app:confirm-close"),
    cancelClose: () => electron.ipcRenderer.invoke("app:cancel-close")
  }
};
electron.contextBridge.exposeInMainWorld("api", api);
