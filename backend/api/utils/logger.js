import winston from 'winston';
import 'winston-daily-rotate-file';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info', // Dynamic level via env variable
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json() // Structured JSON for easy machine parsing
  ),
  transports: [
    // Standard combined logs
    new winston.transports.DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d' // Auto-delete logs older than 14 days
    }),
    // Error-only logs for quick troubleshooting
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' })
  ]
});

// For local development: log to console with colors
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

export default logger;




/*Usage Example:

// in some other file
const logger = require('./utils/logger');

// Standard informational log
logger.info('User successfully logged in', { userId: '12345' });

// Error logging with context
try {
  throw new Error('Database connection failed');
} catch (error) {
  logger.error('Critical Failure', { 
    message: error.message, 
    stack: error.stack // Always log full stack traces in 2025
  });
}


// Structured log with additional metadata
logger.warn('Disk space running low', {
  availableSpaceMB: 500,
  thresholdMB: 1024
});

// integration with express.js
as middleware to log incoming requests:
app.use((req, res, next) => {
  logger.info('Incoming request', { method: req.method, url: req.url, ip: req.ip });
  next();
});

// or using morgan for HTTP request logging
const express = require('express');
const morgan = require('morgan');
const logger = require('./utils/logger');

const app = express();

app.use(morgan(':method :url :status :response-time ms', {
  stream: { write: (msg) => logger.info(msg.trim()) }
}));


*/