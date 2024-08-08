import path from 'path';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logDirectory = path.resolve('logs');

// Текущая дата для имени файла
// const currentDate = new Date().toISOString().split('T')[0];

// Создаем транспортер для логирования в файл с ротацией
const transport = new DailyRotateFile({
  filename: `${logDirectory}/log-%DATE%.log`,
  datePattern: 'YYYY-MM-DD',
  zippedArchive: false,
  maxSize: '10k', // Максимальный размер файла
  maxFiles: '30d', // Удаление файлов старше 14 дней (можно изменить)
});

// Конфигурация логгера
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`),
  ),
  transports: [
    new winston.transports.Console({
      // format: winston.format.simple(),
      handleExceptions: true, // Обработка исключений
      stdout: true, // Явное указание на использование stdout
    }), // Логирование в консоль
    transport, // Логирование в файл с ротацией
  ],
});

export default logger;
