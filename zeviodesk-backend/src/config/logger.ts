/**
 * Centralized Application Logger
 */

export const logsBuffer: Array<{ timestamp: string; level: string; message: string; meta?: any }> = [];

export const logger = {
  info: (message: string, meta?: any) => {
    const entry = { timestamp: new Date().toISOString(), level: "INFO", message, meta };
    logsBuffer.unshift(entry);
    if (logsBuffer.length > 100) logsBuffer.pop();
    console.log(`[INFO] [${entry.timestamp}] ${message}`, meta ? JSON.stringify(meta) : "");
  },
  warn: (message: string, meta?: any) => {
    const entry = { timestamp: new Date().toISOString(), level: "WARN", message, meta };
    logsBuffer.unshift(entry);
    if (logsBuffer.length > 100) logsBuffer.pop();
    console.warn(`[WARN] [${entry.timestamp}] ${message}`, meta ? JSON.stringify(meta) : "");
  },
  error: (message: string, meta?: any) => {
    const entry = { timestamp: new Date().toISOString(), level: "ERROR", message, meta };
    logsBuffer.unshift(entry);
    if (logsBuffer.length > 100) logsBuffer.pop();
    console.error(`[ERROR] [${entry.timestamp}] ${message}`, meta ? JSON.stringify(meta) : "");
  },
  debug: (message: string, meta?: any) => {
    const entry = { timestamp: new Date().toISOString(), level: "DEBUG", message, meta };
    logsBuffer.unshift(entry);
    if (logsBuffer.length > 100) logsBuffer.pop();
    console.debug(`[DEBUG] [${entry.timestamp}] ${message}`, meta ? JSON.stringify(meta) : "");
  },
};
