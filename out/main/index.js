"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const electron = require("electron");
const path = require("path");
const fs = require("fs");
require("papaparse");
require("xlsx");
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
var TransactionType = /* @__PURE__ */ ((TransactionType2) => {
  TransactionType2["Income"] = "income";
  TransactionType2["Expense"] = "expense";
  TransactionType2["Refund"] = "refund";
  TransactionType2["Investment"] = "investment";
  TransactionType2["Transfer"] = "transfer";
  return TransactionType2;
})(TransactionType || {});
var Language = /* @__PURE__ */ ((Language2) => {
  Language2["En"] = "en";
  Language2["Fa"] = "fa";
  return Language2;
})(Language || {});
var Theme = /* @__PURE__ */ ((Theme2) => {
  Theme2["Dark"] = "dark";
  Theme2["Light"] = "light";
  return Theme2;
})(Theme || {});
var InstallmentStatus = /* @__PURE__ */ ((InstallmentStatus2) => {
  InstallmentStatus2["Pending"] = "pending";
  InstallmentStatus2["Paid"] = "paid";
  return InstallmentStatus2;
})(InstallmentStatus || {});
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
const BREAKS = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
function div(a, b) {
  return ~~(a / b);
}
function mod(a, b) {
  return a - ~~(a / b) * b;
}
function jalCalCore(jy) {
  const gy = jy + 621;
  let leapJ = -14;
  let jp = BREAKS[0];
  let jm = 0;
  let jump = 0;
  for (let i = 1; i < BREAKS.length; i += 1) {
    jm = BREAKS[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  const n = jy - jp;
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  return { gy, march, jump, n };
}
function leapFromCycle(jump, n) {
  let adjusted = n;
  if (jump - n < 6) {
    adjusted = n - jump + div(jump + 4, 33) * 33;
  }
  let leap = mod(mod(adjusted + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;
  return leap;
}
function jalCal(jy) {
  const { gy, march, jump, n } = jalCalCore(jy);
  return { leap: leapFromCycle(jump, n), gy, march };
}
function g2d(gy, gm, gd) {
  let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}
function d2g(jdn) {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}
function d2j(jdn) {
  const gy = d2g(jdn).gy;
  let jy = gy - 621;
  const r = jalCal(jy);
  const jdn1f = g2d(gy, 3, r.march);
  let k = jdn - jdn1f;
  if (k >= 0) {
    if (k <= 185) {
      return { jy, jm: 1 + div(k, 31), jd: mod(k, 31) + 1 };
    }
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }
  return { jy, jm: 7 + div(k, 30), jd: mod(k, 30) + 1 };
}
function gregorianToJalali(gy, gm, gd) {
  if (gm < 1 || gm > 12) throw new Error(`Invalid Gregorian month: ${gm}`);
  const daysInMonth = [31, gy % 4 === 0 && (gy % 100 !== 0 || gy % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (gd < 1 || gd > daysInMonth[gm - 1]) throw new Error(`Invalid Gregorian day: ${gd} for month ${gm}`);
  return d2j(g2d(gy, gm, gd));
}
function gregorianDateToJalali(dateStr) {
  const parts = dateStr.split("-");
  if (parts.length === 2) {
    const gy2 = parseInt(parts[0], 10);
    const gm2 = parseInt(parts[1], 10);
    return gregorianToJalali(gy2, gm2, 1);
  }
  if (parts.length !== 3) throw new Error(`Invalid date format: ${dateStr}`);
  const gy = parseInt(parts[0], 10);
  const gm = parseInt(parts[1], 10);
  const gd = parseInt(parts[2], 10);
  return gregorianToJalali(gy, gm, gd);
}
const AMOUNT_FACTOR = 100;
function roundAmount(value) {
  return Math.round(value * AMOUNT_FACTOR) / AMOUNT_FACTOR;
}
function getPayableMonth(dateStr) {
  try {
    const j = gregorianDateToJalali(dateStr);
    return { jy: j.jy, jm: j.jm };
  } catch {
    return null;
  }
}
function isInSameMonth(dateStr, target) {
  try {
    const j = gregorianDateToJalali(dateStr);
    return j.jy === target.jy && j.jm === target.jm;
  } catch {
    return false;
  }
}
function isPaymentType(transaction) {
  return transaction.type === TransactionType.Expense || transaction.type === TransactionType.Refund;
}
function signedAmount(transaction) {
  if (transaction.type === TransactionType.Expense) return transaction.amount;
  if (transaction.type === TransactionType.Refund) return -transaction.amount;
  return 0;
}
function sumSigned(transactions) {
  return roundAmount(transactions.reduce((sum, transaction) => sum + signedAmount(transaction), 0));
}
class PayableService {
  static create(payables, data) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const payable = {
      id: generateId(),
      title: data.title,
      categoryId: data.categoryId,
      totalAmount: data.totalAmount,
      to: data.to,
      notes: data.notes ?? "",
      dueDate: data.dueDate || void 0,
      installments: data.installments,
      createdAt: now,
      updatedAt: now
    };
    return [...payables, payable];
  }
  static update(payables, id, updates) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    return payables.map(
      (p) => p.id === id ? { ...p, ...updates, updatedAt: now } : p
    );
  }
  static delete(payables, id) {
    return payables.filter((p) => p.id !== id);
  }
  static matchesLegacy(payable, transaction) {
    if (!isPaymentType(transaction)) return false;
    if (transaction.categoryId !== payable.categoryId) return false;
    const payee = (payable.to || "").toLowerCase().trim();
    if (!payee) return false;
    if (!`${transaction.title} ${transaction.notes}`.toLowerCase().includes(payee)) return false;
    const month = getPayableMonth(payable.dueDate || payable.createdAt.slice(0, 10));
    if (!month) return true;
    return isInSameMonth(transaction.date, month);
  }
  static getLegacyTransactions(payable, transactions, payables = []) {
    const candidates = payables.length > 0 ? payables : [payable];
    return transactions.filter((transaction) => {
      if (!PayableService.matchesLegacy(payable, transaction)) return false;
      const matches = candidates.filter((candidate) => PayableService.matchesLegacy(candidate, transaction));
      return matches.length === 1 && matches[0].id === payable.id;
    });
  }
  static getExplicitTransactions(payable, transactions) {
    const installmentIds = new Set((payable.installments ?? []).map((item) => item.id));
    return transactions.filter((t) => {
      if (t.payableId !== payable.id || !isPaymentType(t)) return false;
      if (!t.installmentId) return true;
      return installmentIds.has(t.installmentId);
    });
  }
  static getPaymentSource(payable, transactions, payables = []) {
    if (PayableService.getExplicitTransactions(payable, transactions).length > 0) return "explicit";
    if (PayableService.getLegacyTransactions(payable, transactions, payables).length > 0) return "legacy";
    return "none";
  }
  static getPaymentTransactions(payable, transactions, payables = []) {
    const source = PayableService.getPaymentSource(payable, transactions, payables);
    if (source === "explicit") return PayableService.getExplicitTransactions(payable, transactions);
    if (source === "legacy") return PayableService.getLegacyTransactions(payable, transactions, payables);
    return [];
  }
  static getPaidAmount(payable, transactions, payables = []) {
    const net = sumSigned(PayableService.getPaymentTransactions(payable, transactions, payables));
    const bounded = Math.max(0, net);
    const total = Number.isFinite(payable.totalAmount) ? payable.totalAmount : bounded;
    return roundAmount(Math.min(bounded, total));
  }
  static getRemainingAmount(payable, transactions, payables = []) {
    return roundAmount(Math.max(0, payable.totalAmount - PayableService.getPaidAmount(payable, transactions, payables)));
  }
  static getPaidDate(payable, transactions, payables = []) {
    if (PayableService.getRemainingAmount(payable, transactions, payables) > 0) return null;
    const payments = PayableService.getPaymentTransactions(payable, transactions, payables).filter((t) => t.type === TransactionType.Expense);
    if (payments.length === 0) return null;
    return payments.reduce((latest, t) => t.date > latest ? t.date : latest, payments[0].date);
  }
  static getInstallmentNetPaid(payable, installment, transactions, payables = []) {
    const explicit = PayableService.getExplicitTransactions(payable, transactions);
    if (explicit.length > 0) {
      const net = sumSigned(explicit.filter((t) => t.installmentId === installment.id));
      return roundAmount(Math.min(Math.max(0, net), Math.max(0, installment.amount)));
    }
    const legacyNet = sumSigned(PayableService.getLegacyTransactions(payable, transactions, payables));
    if (legacyNet <= 0) return 0;
    let remaining = legacyNet;
    const ordered = [...payable.installments ?? []].sort(
      (a, b) => a.dueDate.localeCompare(b.dueDate) || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)
    );
    for (const item of ordered) {
      const allocation = Math.min(Math.max(0, item.amount), remaining);
      if (item.id === installment.id) return roundAmount(allocation);
      remaining -= allocation;
      if (remaining <= 0) break;
    }
    return 0;
  }
  static getInstallmentPaidDate(payable, installment, transactions) {
    const payments = PayableService.getExplicitTransactions(payable, transactions).filter(
      (t) => t.installmentId === installment.id && t.type === TransactionType.Expense
    );
    if (payments.length === 0) return null;
    return payments.reduce((latest, t) => t.date > latest ? t.date : latest, payments[0].date);
  }
  static hasPaymentHistory(payable, transactions) {
    return PayableService.getExplicitTransactions(payable, transactions).some(
      (t) => !!t.installmentId
    );
  }
  static canDelete(payable, transactions) {
    return PayableService.getExplicitTransactions(payable, transactions).length === 0;
  }
  static validatePayment(data, payables, transactions, excludeTransactionId) {
    const codes = [];
    if (!data.payableId) {
      return { valid: !data.installmentId, codes: data.installmentId ? ["payable"] : [] };
    }
    const payable = payables.find((p) => p.id === data.payableId);
    if (!payable) codes.push("payable");
    if (data.type !== TransactionType.Expense && data.type !== TransactionType.Refund) codes.push("type");
    if (!Number.isFinite(data.amount) || data.amount <= 0) codes.push("amount");
    if (data.categoryId !== payable?.categoryId) codes.push("category");
    let installment;
    if (data.installmentId) {
      installment = payable?.installments?.find((item) => item.id === data.installmentId);
      if (!installment) codes.push("installment");
    }
    if (payable && installment && Number.isFinite(data.amount) && data.amount > 0) {
      const others = PayableService.getExplicitTransactions(payable, transactions).filter(
        (t) => t.id !== excludeTransactionId && t.installmentId === installment?.id
      );
      const existing = sumSigned(others);
      const signed = signedAmount({ type: data.type, amount: data.amount });
      const target = Math.max(0, installment.amount);
      const next = roundAmount(existing + signed);
      if (data.type === TransactionType.Expense && next > target) codes.push("overpayment");
      if (data.type === TransactionType.Refund && next < 0) codes.push("refund");
    } else if (payable && !data.installmentId && Number.isFinite(data.amount) && data.amount > 0) {
      const installments = payable.installments ?? [];
      if (installments.length === 0) {
        const others = PayableService.getExplicitTransactions(payable, transactions).filter(
          (t) => t.id !== excludeTransactionId && !t.installmentId
        );
        const existing = sumSigned(others);
        const signed = signedAmount({ type: data.type, amount: data.amount });
        const next = roundAmount(existing + signed);
        if (data.type === TransactionType.Expense && next > Math.max(0, payable.totalAmount)) codes.push("overpayment");
        if (data.type === TransactionType.Refund && next < 0) codes.push("refund");
      } else {
        codes.push("installment");
      }
    }
    return { valid: codes.length === 0, codes: Array.from(new Set(codes)) };
  }
}
const SCHEMA_VERSION = 5;
function migrateToV5(data) {
  const fallbackTime = data.updatedAt || data.createdAt || (/* @__PURE__ */ new Date(0)).toISOString();
  const payables = (data.payables ?? []).map((payable, payableIndex) => ({
    ...payable,
    installments: (payable.installments ?? []).map((installment, installmentIndex) => ({
      ...installment,
      id: installment.id || `${payable.id}-installment-${installmentIndex + 1}`,
      createdAt: installment.createdAt || payable.createdAt || fallbackTime,
      updatedAt: installment.updatedAt || installment.createdAt || payable.updatedAt || fallbackTime
    }))
  }));
  data.payables = payables;
  const isPaymentType2 = (type) => type === TransactionType.Expense || type === TransactionType.Refund;
  data.transactions = (data.transactions ?? []).map((transaction) => {
    if (transaction.payableId || !isPaymentType2(transaction.type)) return transaction;
    const matches = payables.filter(
      (payable) => PayableService.getLegacyTransactions(payable, [transaction], payables).length > 0
    );
    if (matches.length !== 1 || (matches[0].installments ?? []).length > 0) return transaction;
    return { ...transaction, payableId: matches[0].id };
  });
}
class DatasetService {
  static create(name, currency, categories, receivables = [], transactions = [], payables = [], wallets = []) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    return {
      version: SCHEMA_VERSION,
      name,
      currency,
      createdAt: now,
      updatedAt: now,
      transactions,
      categories,
      receivables,
      wallets,
      payables
    };
  }
  static serialize(dataset) {
    return JSON.stringify({ ...dataset, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }, null, 2);
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
    if (!data.payables) {
      data.payables = [];
    }
    if (!data.wallets) {
      data.wallets = [];
    }
    if (!data.categoryTypeMap) {
      data.categoryTypeMap = {};
    }
    if (!data.budgetPercentages) {
      data.budgetPercentages = {};
    }
    if (data.version < SCHEMA_VERSION) {
      migrateToV5(data);
      data.version = SCHEMA_VERSION;
    }
    return data;
  }
}
class DatasetImportError extends Error {
  constructor(message) {
    super(message);
    this.name = "DatasetImportError";
  }
}
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function stringField(value, label, issues) {
  if (typeof value !== "string") {
    issues.push(`${label} must be a string`);
    return "";
  }
  return value;
}
function idField(value, label, issues) {
  if (typeof value !== "string" || value.length === 0) {
    issues.push(`${label} must be a non-empty string`);
    return "";
  }
  return value;
}
function optionalStringField(value, label, issues) {
  if (value === void 0 || value === null || value === "") return void 0;
  if (typeof value !== "string") {
    issues.push(`${label} must be a string`);
    return void 0;
  }
  return value;
}
function numberField(value, label, issues) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    issues.push(`${label} must be a finite number`);
    return Number.NaN;
  }
  return value;
}
function booleanField(value, label, issues) {
  if (typeof value !== "boolean") {
    issues.push(`${label} must be a boolean`);
    return false;
  }
  return value;
}
function arrayField(value, label, issues) {
  if (!Array.isArray(value)) {
    issues.push(`${label} must be an array`);
    return [];
  }
  return value;
}
function optionalObjectField(value, label, issues) {
  if (value === void 0 || value === null) return {};
  if (!isRecord(value)) {
    issues.push(`${label} must be an object`);
    return {};
  }
  return value;
}
function transactionTypeField(value, label, issues) {
  if (!Object.values(TransactionType).includes(value)) {
    issues.push(`${label} has an invalid transaction type`);
    return TransactionType.Expense;
  }
  return value;
}
function installmentStatusField(value, label, issues) {
  if (!Object.values(InstallmentStatus).includes(value)) {
    issues.push(`${label} has an invalid installment status`);
    return InstallmentStatus.Pending;
  }
  return value;
}
function uniqueId(id, label, seen, issues) {
  if (seen.has(id)) {
    issues.push(`${label} has a duplicate id: ${id}`);
    return;
  }
  seen.add(id);
}
function validateDataset(input) {
  const issues = [];
  if (!isRecord(input)) {
    throw new DatasetImportError("Dataset must be an object");
  }
  if (typeof input.version !== "number" || !Number.isFinite(input.version) || input.version <= 0) {
    issues.push("Dataset version must be a positive number");
  }
  stringField(input.name, "Dataset name", issues);
  stringField(input.currency, "Dataset currency", issues);
  stringField(input.createdAt, "Dataset createdAt", issues);
  stringField(input.updatedAt, "Dataset updatedAt", issues);
  const categoryValues = arrayField(input.categories, "Dataset categories", issues);
  const walletValues = arrayField(input.wallets, "Dataset wallets", issues);
  const receivableValues = arrayField(input.receivables, "Dataset receivables", issues);
  const payableValues = arrayField(input.payables, "Dataset payables", issues);
  const transactionValues = arrayField(input.transactions, "Dataset transactions", issues);
  const categoryTypeMap = optionalObjectField(input.categoryTypeMap, "Dataset categoryTypeMap", issues);
  const budgetPercentages = optionalObjectField(input.budgetPercentages, "Dataset budgetPercentages", issues);
  const categoryIds = /* @__PURE__ */ new Set();
  const categories = categoryValues.map((value, index) => {
    if (!isRecord(value)) {
      issues.push(`Category ${index + 1} must be an object`);
      return null;
    }
    const label = `Category ${index + 1}`;
    const id = idField(value.id, `${label} id`, issues);
    if (id) uniqueId(id, label, categoryIds, issues);
    const category = {
      id,
      name: stringField(value.name, `${label} name`, issues),
      color: stringField(value.color, `${label} color`, issues),
      icon: stringField(value.icon, `${label} icon`, issues),
      isDefault: booleanField(value.isDefault, `${label} isDefault`, issues),
      createdAt: stringField(value.createdAt, `${label} createdAt`, issues)
    };
    return category;
  }).filter((item) => item !== null);
  const walletIds = /* @__PURE__ */ new Set();
  const wallets = walletValues.map((value, index) => {
    if (!isRecord(value)) {
      issues.push(`Wallet ${index + 1} must be an object`);
      return null;
    }
    const label = `Wallet ${index + 1}`;
    const id = idField(value.id, `${label} id`, issues);
    if (id) uniqueId(id, label, walletIds, issues);
    const wallet = {
      id,
      name: stringField(value.name, `${label} name`, issues),
      initialBalance: numberField(value.initialBalance, `${label} initialBalance`, issues),
      color: stringField(value.color, `${label} color`, issues),
      createdAt: stringField(value.createdAt, `${label} createdAt`, issues)
    };
    return wallet;
  }).filter((item) => item !== null);
  const receivableIds = /* @__PURE__ */ new Set();
  const receivables = receivableValues.map((value, index) => {
    if (!isRecord(value)) {
      issues.push(`Receivable ${index + 1} must be an object`);
      return null;
    }
    const label = `Receivable ${index + 1}`;
    const id = idField(value.id, `${label} id`, issues);
    if (id) uniqueId(id, label, receivableIds, issues);
    const categoryId = stringField(value.categoryId, `${label} categoryId`, issues);
    if (categoryId && !categoryIds.has(categoryId)) {
      issues.push(`${label} references an unknown category: ${categoryId}`);
    }
    const receivable = {
      id,
      title: stringField(value.title, `${label} title`, issues),
      categoryId,
      totalAmount: numberField(value.totalAmount, `${label} totalAmount`, issues),
      from: stringField(value.from, `${label} from`, issues),
      notes: stringField(value.notes, `${label} notes`, issues),
      askDate: optionalStringField(value.askDate, `${label} askDate`, issues),
      createdAt: stringField(value.createdAt, `${label} createdAt`, issues),
      updatedAt: stringField(value.updatedAt, `${label} updatedAt`, issues)
    };
    return receivable;
  }).filter((item) => item !== null);
  const installmentIds = /* @__PURE__ */ new Set();
  const payableIds = /* @__PURE__ */ new Set();
  const payables = payableValues.map((value, index) => {
    if (!isRecord(value)) {
      issues.push(`Payable ${index + 1} must be an object`);
      return null;
    }
    const label = `Payable ${index + 1}`;
    const id = idField(value.id, `${label} id`, issues);
    if (id) uniqueId(id, label, payableIds, issues);
    const categoryId = stringField(value.categoryId, `${label} categoryId`, issues);
    if (categoryId && !categoryIds.has(categoryId)) {
      issues.push(`${label} references an unknown category: ${categoryId}`);
    }
    const rawInstallments = arrayField(value.installments ?? [], `${label} installments`, issues);
    const installments = rawInstallments.map((installmentValue, installmentIndex) => {
      if (!isRecord(installmentValue)) {
        issues.push(`${label} installment ${installmentIndex + 1} must be an object`);
        return null;
      }
      const installmentLabel = `${label} installment ${installmentIndex + 1}`;
      const installmentId = idField(installmentValue.id, `${installmentLabel} id`, issues);
      if (installmentId) uniqueId(installmentId, "Installment", installmentIds, issues);
      const installment = {
        id: installmentId,
        amount: numberField(installmentValue.amount, `${installmentLabel} amount`, issues),
        dueDate: stringField(installmentValue.dueDate, `${installmentLabel} dueDate`, issues),
        status: installmentStatusField(installmentValue.status, `${installmentLabel} status`, issues),
        paidAt: optionalStringField(installmentValue.paidAt, `${installmentLabel} paidAt`, issues),
        createdAt: stringField(installmentValue.createdAt, `${installmentLabel} createdAt`, issues),
        updatedAt: stringField(installmentValue.updatedAt, `${installmentLabel} updatedAt`, issues)
      };
      return installment;
    }).filter((item) => item !== null);
    const payable = {
      id,
      title: stringField(value.title, `${label} title`, issues),
      categoryId,
      totalAmount: numberField(value.totalAmount, `${label} totalAmount`, issues),
      to: stringField(value.to, `${label} to`, issues),
      notes: stringField(value.notes, `${label} notes`, issues),
      dueDate: optionalStringField(value.dueDate, `${label} dueDate`, issues),
      installments,
      createdAt: stringField(value.createdAt, `${label} createdAt`, issues),
      updatedAt: stringField(value.updatedAt, `${label} updatedAt`, issues)
    };
    return payable;
  }).filter((item) => item !== null);
  const installmentsByPayable = /* @__PURE__ */ new Map();
  for (const payable of payables) {
    installmentsByPayable.set(payable.id, new Set((payable.installments ?? []).map((item) => item.id)));
  }
  const transactionIds = /* @__PURE__ */ new Set();
  const transactions = transactionValues.map((value, index) => {
    if (!isRecord(value)) {
      issues.push(`Transaction ${index + 1} must be an object`);
      return null;
    }
    const label = `Transaction ${index + 1}`;
    const id = idField(value.id, `${label} id`, issues);
    if (id) uniqueId(id, label, transactionIds, issues);
    const categoryId = stringField(value.categoryId, `${label} categoryId`, issues);
    if (categoryId && !categoryIds.has(categoryId)) {
      issues.push(`${label} references an unknown category: ${categoryId}`);
    }
    const walletId = optionalStringField(value.walletId, `${label} walletId`, issues);
    const toWalletId = optionalStringField(value.toWalletId, `${label} toWalletId`, issues);
    const payableId = optionalStringField(value.payableId, `${label} payableId`, issues);
    const installmentId = optionalStringField(value.installmentId, `${label} installmentId`, issues);
    if (walletId && !walletIds.has(walletId)) {
      issues.push(`${label} references an unknown wallet: ${walletId}`);
    }
    if (toWalletId && !walletIds.has(toWalletId)) {
      issues.push(`${label} references an unknown toWallet: ${toWalletId}`);
    }
    if (payableId && !payableIds.has(payableId)) {
      issues.push(`${label} references an unknown payable: ${payableId}`);
    }
    if (installmentId && !payableId) {
      issues.push(`${label} has an installmentId without a payableId`);
    }
    if (installmentId && payableId && !installmentsByPayable.get(payableId)?.has(installmentId)) {
      issues.push(`${label} references installment ${installmentId} outside payable ${payableId}`);
    }
    const transaction = {
      id,
      date: stringField(value.date, `${label} date`, issues),
      title: stringField(value.title, `${label} title`, issues),
      categoryId,
      type: transactionTypeField(value.type, `${label} type`, issues),
      amount: numberField(value.amount, `${label} amount`, issues),
      notes: stringField(value.notes, `${label} notes`, issues),
      walletId,
      toWalletId,
      payableId,
      installmentId,
      createdAt: stringField(value.createdAt, `${label} createdAt`, issues),
      updatedAt: stringField(value.updatedAt, `${label} updatedAt`, issues)
    };
    return transaction;
  }).filter((item) => item !== null);
  for (const [key, value] of Object.entries(categoryTypeMap)) {
    transactionTypeField(value, `categoryTypeMap.${key}`, issues);
  }
  for (const [key, value] of Object.entries(budgetPercentages)) {
    numberField(value, `budgetPercentages.${key}`, issues);
  }
  if (issues.length > 0) {
    throw new DatasetImportError(issues.join("\n"));
  }
  return {
    version: input.version,
    name: input.name,
    currency: input.currency,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
    transactions,
    categories,
    receivables,
    wallets,
    payables,
    categoryTypeMap,
    budgetPercentages
  };
}
function normalizeImportedDataset(input) {
  if (!isRecord(input)) {
    throw new DatasetImportError("Dataset must be an object");
  }
  if (typeof input.version !== "number" || !Number.isFinite(input.version) || input.version <= 0) {
    throw new DatasetImportError("Dataset version must be a positive number");
  }
  try {
    const normalized = DatasetService.deserialize(JSON.stringify(input));
    return validateDataset(normalized);
  } catch (error) {
    if (error instanceof DatasetImportError) throw error;
    throw new DatasetImportError(`Invalid dataset: ${error instanceof Error ? error.message : String(error)}`);
  }
}
function importFinaDataset(content) {
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new DatasetImportError(`Invalid dataset file: ${error instanceof Error ? error.message : String(error)}`);
  }
  return normalizeImportedDataset(parsed);
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
      const dataset = importFinaDataset(content);
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
      const dataset = DatasetService.create("My Finances", "toman", categories);
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
  electron.ipcMain.handle("dialog:openDatasetBackup", async () => {
    const result = await electron.dialog.showOpenDialog({
      filters: [
        { name: "All Dataset Backups", extensions: ["fina", "json", "xlsx", "csv"] },
        { name: "Finance Dataset", extensions: ["fina", "json"] },
        { name: "Excel Workbook", extensions: ["xlsx"] },
        { name: "CSV Backup", extensions: ["csv"] }
      ],
      properties: ["openFile"]
    });
    return result;
  });
}
const SETTINGS_VERSION = 2;
const defaultSettings = {
  language: Language.En,
  theme: Theme.Dark,
  visibleDashboardCards: [
    "totalIncome",
    "totalExpenses",
    "netBalance",
    "transactionCount",
    "avgDailySpending",
    "avgWeeklySpending"
  ],
  lastOpenedDataset: null,
  recentDatasets: [],
  lastExportTimestamp: null
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
      theme: Object.values(Theme).includes(data.theme) ? data.theme : Theme.Dark,
      visibleDashboardCards: Array.isArray(data.visibleDashboardCards) ? data.visibleDashboardCards : defaultSettings.visibleDashboardCards,
      lastOpenedDataset: typeof data.lastOpenedDataset === "string" ? data.lastOpenedDataset : null,
      recentDatasets: Array.isArray(data.recentDatasets) ? data.recentDatasets : [],
      lastExportTimestamp: typeof data.lastExportTimestamp === "string" ? data.lastExportTimestamp : null
    };
    return validated;
  }
  static validate(settings) {
    if (!settings || typeof settings !== "object") return false;
    const s = settings;
    return Object.values(Language).includes(s.language) && Object.values(Theme).includes(s.theme) && Array.isArray(s.visibleDashboardCards) && (s.lastOpenedDataset === null || typeof s.lastOpenedDataset === "string") && Array.isArray(s.recentDatasets) && (s.lastExportTimestamp === null || typeof s.lastExportTimestamp === "string");
  }
}
function getSettingsPath$1() {
  return `${electron.app.getPath("userData")}/settings.json`;
}
function getInitialTheme() {
  try {
    const settingsPath = getSettingsPath$1();
    if (!fs.existsSync(settingsPath)) return Theme.Dark;
    const settings = SettingsService.deserialize(fs.readFileSync(settingsPath, "utf-8"));
    return settings.theme;
  } catch {
    return Theme.Dark;
  }
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
  electron.ipcMain.on("theme:get", (event) => {
    event.returnValue = getInitialTheme();
  });
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
  electron.ipcMain.handle("print:pdf", async (_event, html) => {
    const printWindow = new electron.BrowserWindow({
      show: false,
      width: 800,
      height: 600,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false
      }
    });
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    try {
      const pdfData = await printWindow.webContents.printToPDF({
        printBackground: true,
        pageSize: "A4",
        marginTop: 0.4,
        marginBottom: 0.4,
        marginLeft: 0.4,
        marginRight: 0.4
      });
      const base64 = pdfData.toString("base64");
      return { success: true, data: base64 };
    } catch (err) {
      console.error("PDF generation failed:", err);
      return { success: false, error: String(err) };
    } finally {
      printWindow.close();
    }
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
