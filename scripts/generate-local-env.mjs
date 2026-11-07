#!/usr/bin/env node
import { randomBytes } from 'node:crypto';
import { writeFileSync, existsSync } from 'node:fs';

const force = process.argv.includes('--force');
if (existsSync('.env') && !force) {
  console.error('.env already exists. Pass --force to overwrite.');
  process.exit(1);
}

const secret = (bytes = 48) => randomBytes(bytes).toString('base64url');

const content = `APP_NAME=NestJS Boilerplate
PORT=3000
NODE_ENV=development

# PostgreSQL — distinct DB names required for DEV / TEST / PROD
DATABASE_URL_DEV=postgresql://postgres:postgres@localhost:5432/app_dev
DATABASE_URL_TEST=postgresql://postgres:postgres@localhost:5432/app_test
DATABASE_URL_PROD=postgresql://postgres:postgres@localhost:5432/app_prod

# Authentication and token security
JWT_SECRET=${secret()}
REFRESH_JWT_SECRET=${secret()}
TOKEN_ENCRYPTION_KEY=${secret()}
JWT_EXPIRES_IN=15m
REFRESH_JWT_EXPIRES_IN=7d
SESSION_CLEANUP_DAYS=30
FRONTEND_BASE_URL=http://localhost:5173

# Email delivery (local placeholders)
EMAIL_RETRY_ATTEMPTS=3
EMAIL_RETRY_DELAY=1000
EMAIL_TIMEOUT=10000
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_SECURE=false
MAIL_USER=mailer@example.com
MAIL_PASSWORD=local-dev-mail-password
MAIL_FROM=no-reply@example.com
MAIL_FROM_NAME=NestJS Boilerplate

# Redis / cache
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_KEY_PREFIX=app:
REDIS_TTL=3600
CACHE_ENABLED=true

# BullMQ / jobs
JOBS_ENABLED=true
REDIS_QUEUE_DB=1
REMINDER_MAX_ACTIVE_PER_USER=25
REMINDER_MAX_SLOTS=5
REMINDER_MAX_CHANNELS=2
REMINDER_SCHEDULER_INTERVAL_MS=60000
REMINDER_SCHEDULER_BATCH_SIZE=100
REMINDER_DISPATCH_CONCURRENCY=5
NOTIFICATION_EMAIL_CONCURRENCY=3
NOTIFICATION_IN_APP_CONCURRENCY=10
NOTIFICATION_EMAIL_MAX_PER_SECOND=10
JOB_ATTEMPTS=5
JOB_BACKOFF_MS=30000

# Rate limiting
THROTTLE_TTL_MS=60000
THROTTLE_LIMIT=100

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
CORS_ENABLED=true
CORS_CREDENTIALS=true
CORS_MAX_AGE=86400

# Swagger
SWAGGER_ENABLED=true

# Integrations
API_ACCESS_KEY=local-dev-api-access-key-${secret(16)}
WORLD_TIME_API_BASE_URL=https://worldtimeapi.org/api
GOOGLE_CLIENT_ID=local-dev-google-client-id.apps.googleusercontent.com

# Seed admin
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=LocalDevAdminPass1!
SUPER_ADMIN_FIRST_NAME=Platform
SUPER_ADMIN_LAST_NAME=Admin
`;

writeFileSync('.env', content, 'utf8');
console.log('Wrote .env for local development (gitignored).');
console.log('Admin seed: admin@example.com / LocalDevAdminPass1!');
