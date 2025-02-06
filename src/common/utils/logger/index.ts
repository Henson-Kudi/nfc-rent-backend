import envConf from '@/config/env.conf';
import path from 'path';
import { createLogger, transports, format } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logDir = path.join(process.cwd(), 'logs');

// Define the log format
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.simple()
);

// Define the logger
const logger = createLogger({
  level: 'info', // Set your desired log level
  format: logFormat,
  transports: [
    new DailyRotateFile({
      filename: `${logDir}/%DATE%-error.log`, // Log files will be placed in the "logs" directory
      datePattern: 'YYYY-MM-DD', // Daily log rotation
      level: 'error', // Log error messages and above to this file
      zippedArchive: true, // Compress old log files
    }),
    new DailyRotateFile({
      filename: `${logDir}/%DATE%-combined.log`,
      datePattern: 'YYYY-MM-DD',
      level: 'info', // Log info messages and above to this file
      zippedArchive: true,
    }),
  ],
});

if (envConf.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: format.combine(format.colorize(), logFormat),
    })
  );
}

export default logger;
