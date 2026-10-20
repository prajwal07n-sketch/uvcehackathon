import fs from 'fs';
import path from 'path';
import os from 'os';
import { DEV_DB_BASE64 } from './db-seed-data';

let initialized = false;

export function getDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL;

  // If a remote external database is configured (Postgres, Neon, Supabase, MySQL), use it directly
  if (
    envUrl &&
    (envUrl.startsWith('postgresql://') ||
      envUrl.startsWith('postgres://') ||
      envUrl.startsWith('mysql://'))
  ) {
    return envUrl;
  }

  // Check if running in a Serverless / Cloud runtime (Vercel, AWS Lambda)
  const isServerless = Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.VERCEL_ENV
  );

  let targetFilePath: string;

  if (isServerless) {
    // In serverless environments, /tmp is the only writable directory
    targetFilePath = '/tmp/campus.db';
  } else {
    // In local development or node servers
    targetFilePath = path.resolve(process.cwd(), 'prisma', 'dev.db');
  }

  if (!initialized) {
    try {
      if (!fs.existsSync(/*turbopackIgnore: true*/ targetFilePath)) {
        // Ensure parent directory exists
        const parentDir = path.dirname(targetFilePath);
        if (!fs.existsSync(/*turbopackIgnore: true*/ parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true });
        }

        // Initialize SQLite database from pre-seeded verified binary snapshot
        const buffer = Buffer.from(DEV_DB_BASE64, 'base64');
        fs.writeFileSync(targetFilePath, buffer);
      }
      initialized = true;
    } catch (err) {
      console.warn('SQLite auto-initialization notice:', err);
    }
  }

  const finalUrl = `file:${targetFilePath}`;
  process.env.DATABASE_URL = finalUrl;
  return finalUrl;
}
