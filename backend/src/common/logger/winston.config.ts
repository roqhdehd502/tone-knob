import * as winston from 'winston';

import 'winston-daily-rotate-file';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf((info) => {
  const i = info as Record<string, string | undefined>;
  const ts = i.timestamp ?? '';
  const ctx = i.context ? ` [${i.context}]` : '';
  const trace = i.trace ? `\n${i.trace}` : '';
  return `${ts} [${info.level}]${ctx} ${i.message ?? ''}${trace}`;
});

export const winstonConfig = {
  transports: [
    // 콘솔 출력
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        logFormat,
      ),
    }),

    // 일반 로그 파일 (일별 회전)
    new winston.transports.DailyRotateFile({
      filename: 'logs/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        logFormat,
      ),
    }),

    // 에러 로그 파일 (별도 관리)
    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error',
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        logFormat,
      ),
    }),
  ],
};
