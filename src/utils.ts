import { createLogger, format, transports } from 'winston';
const { combine, printf } = format;

const formatDate = (date: Date) => {
  let month = '' + (date.getMonth() + 1);
  let day = '' + date.getDate();
  const year = date.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
};

const loggerFormat = printf(({ level, message, timestamp }) => {
  return `[${timestamp}] ${level}: ${message}`;
});

export const logger = createLogger({
  level: 'info',
  format: combine(
    format.colorize(),
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    loggerFormat
  ),
  transports: [
    new transports.File({
      filename: `logs/${formatDate(new Date())}-error.log`,
      level: 'error'
    }),
    new transports.File({
      filename: `logs/${formatDate(new Date())}.log`,
      level: 'info'
    }),
    new transports.Console({
      format: loggerFormat,
      level: 'info'
    })
  ]
})