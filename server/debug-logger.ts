import fs from 'fs';
import path from 'path';

const logFile = path.join(process.cwd(), 'debug.log');

export function debugLog(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = data 
    ? `[${timestamp}] ${message}\n${JSON.stringify(data, null, 2)}\n\n`
    : `[${timestamp}] ${message}\n\n`;
  
  fs.appendFileSync(logFile, logEntry);
  console.log(message, data || '');
}

// Initialiser le fichier de log
fs.writeFileSync(logFile, `=== Logs de débogage - ${new Date().toISOString()} ===\n\n`);
