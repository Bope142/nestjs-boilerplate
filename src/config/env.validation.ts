import { Logger } from '@nestjs/common';
import { config as loadEnv } from 'dotenv';

export function validateEnvironment(): void {
  loadEnv({ path: '.env', quiet: true });

  const logger = new Logger('EnvironmentValidation');

  // Liste complète des variables obligatoires, incluant GOOGLE_CLIENT_ID
  const requiredVars = [
    'DATABASE_URL_DEV',
    'DATABASE_URL_PROD',
    'JWT_SECRET',
    'REFRESH_JWT_SECRET',
    'TOKEN_ENCRYPTION_KEY',
    'JWT_EXPIRES_IN',
    'REFRESH_JWT_EXPIRES_IN',
    'FRONTEND_BASE_URL',
    'PORT',
    'EMAIL_RETRY_ATTEMPTS',
    'EMAIL_RETRY_DELAY',
    'EMAIL_TIMEOUT',
    'SESSION_CLEANUP_DAYS',
    'MAIL_HOST',
    'MAIL_PORT',
    'MAIL_SECURE',
    'MAIL_USER',
    'MAIL_PASSWORD',
    'MAIL_FROM',
    'MAIL_FROM_NAME',
    'REDIS_HOST',
    'REDIS_PORT',
    'REDIS_TTL',
    'CACHE_ENABLED',
    'THROTTLE_TTL_MS',
    'THROTTLE_LIMIT',
    'CORS_ORIGINS',
    'CORS_ENABLED',
    'CORS_CREDENTIALS',
    'CORS_MAX_AGE',
    'API_ACCESS_KEY',
    'WORLD_TIME_API_BASE_URL',
    'GOOGLE_CLIENT_ID',
    'SUPER_ADMIN_EMAIL',
    'SUPER_ADMIN_PASSWORD',
    'SUPER_ADMIN_FIRST_NAME',
    'SUPER_ADMIN_LAST_NAME',
  ];

  // Vérifier les variables manquantes
  const missingVars = requiredVars.filter(
    (varName) => !process.env[varName] || process.env[varName]?.trim() === '',
  );

  if (missingVars.length > 0) {
    logger.error(
      `❌ Variables d'environnement obligatoires manquantes: ${missingVars.join(', ')}`,
    );
    logger.error(
      "L'application ne peut pas démarrer sans ces variables. Veuillez les configurer dans votre fichier .env",
    );
    throw new Error(
      `Variables d'environnement manquantes: ${missingVars.join(', ')}`,
    );
  }

  // Validations spécifiques
  const errors: string[] = [];

  // Validation JWT_SECRET
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    errors.push(
      'JWT_SECRET doit contenir au moins 32 caractères pour des raisons de sécurité',
    );
  }

  // Validation REFRESH_JWT_SECRET
  if (
    !process.env.REFRESH_JWT_SECRET ||
    process.env.REFRESH_JWT_SECRET.length < 32
  ) {
    errors.push(
      'REFRESH_JWT_SECRET doit contenir au moins 32 caractères pour des raisons de sécurité',
    );
  }

  // Validation TOKEN_ENCRYPTION_KEY (32 bytes = 64 hex chars, or passphrase >= 32 chars)
  if (
    !process.env.TOKEN_ENCRYPTION_KEY ||
    process.env.TOKEN_ENCRYPTION_KEY.length < 32
  ) {
    errors.push(
      'TOKEN_ENCRYPTION_KEY doit contenir au moins 32 caractères (64 caractères hexadécimaux recommandés pour une clé 32 octets)',
    );
  }

  // Validation API_ACCESS_KEY
  if (
    !process.env.API_ACCESS_KEY ||
    process.env.API_ACCESS_KEY.trim().length === 0
  ) {
    errors.push('API_ACCESS_KEY ne peut pas être vide');
  }

  // Validation GOOGLE_CLIENT_ID
  if (
    !process.env.GOOGLE_CLIENT_ID ||
    process.env.GOOGLE_CLIENT_ID.trim().length === 0
  ) {
    errors.push('GOOGLE_CLIENT_ID ne peut pas être vide');
  }

  // Validation PORT
  const port = parseInt(process.env.PORT || '0', 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    errors.push('PORT doit être un nombre valide entre 1 et 65535');
  }

  // Validation MAIL_PORT
  const mailPort = parseInt(process.env.MAIL_PORT || '0', 10);
  if (isNaN(mailPort) || mailPort < 1 || mailPort > 65535) {
    errors.push('MAIL_PORT doit être un nombre valide entre 1 et 65535');
  }

  // Validation MAIL_SECURE
  const mailSecure = process.env.MAIL_SECURE?.toLowerCase();
  if (mailSecure !== 'true' && mailSecure !== 'false') {
    errors.push('MAIL_SECURE doit être "true" ou "false"');
  }

  // Validation REDIS_PORT
  const redisPort = parseInt(process.env.REDIS_PORT || '0', 10);
  if (isNaN(redisPort) || redisPort < 1 || redisPort > 65535) {
    errors.push('REDIS_PORT doit être un nombre valide entre 1 et 65535');
  }

  // Validation EMAIL_RETRY_ATTEMPTS
  const emailRetryAttempts = parseInt(
    process.env.EMAIL_RETRY_ATTEMPTS || '0',
    10,
  );
  if (isNaN(emailRetryAttempts) || emailRetryAttempts < 0) {
    errors.push('EMAIL_RETRY_ATTEMPTS doit être un nombre positif');
  }

  // Validation EMAIL_RETRY_DELAY
  const emailRetryDelay = parseInt(process.env.EMAIL_RETRY_DELAY || '0', 10);
  if (isNaN(emailRetryDelay) || emailRetryDelay < 0) {
    errors.push(
      'EMAIL_RETRY_DELAY doit être un nombre positif (en millisecondes)',
    );
  }

  // Validation EMAIL_TIMEOUT
  const emailTimeout = parseInt(process.env.EMAIL_TIMEOUT || '0', 10);
  if (isNaN(emailTimeout) || emailTimeout < 0) {
    errors.push('EMAIL_TIMEOUT doit être un nombre positif (en millisecondes)');
  }

  // Validation SESSION_CLEANUP_DAYS
  const sessionCleanupDays = parseInt(
    process.env.SESSION_CLEANUP_DAYS || '0',
    10,
  );
  if (isNaN(sessionCleanupDays) || sessionCleanupDays < 0) {
    errors.push('SESSION_CLEANUP_DAYS doit être un nombre positif');
  }

  // Validation REDIS_TTL
  const redisTtl = parseInt(process.env.REDIS_TTL || '0', 10);
  if (isNaN(redisTtl) || redisTtl < 0) {
    errors.push('REDIS_TTL doit être un nombre positif (en secondes)');
  }

  // Validation REDIS_DB (optional)
  if (
    process.env.REDIS_DB !== undefined &&
    process.env.REDIS_DB.trim() !== ''
  ) {
    const redisDb = parseInt(process.env.REDIS_DB, 10);
    if (isNaN(redisDb) || redisDb < 0) {
      errors.push('REDIS_DB doit être un nombre entier >= 0');
    }
  }

  // Validation CACHE_ENABLED
  const cacheEnabled = process.env.CACHE_ENABLED?.toLowerCase();
  if (cacheEnabled !== 'true' && cacheEnabled !== 'false') {
    errors.push('CACHE_ENABLED doit être "true" ou "false"');
  }

  // Validation JOBS_ENABLED (optional; default true)
  if (
    process.env.JOBS_ENABLED !== undefined &&
    process.env.JOBS_ENABLED.trim() !== ''
  ) {
    const jobsEnabled = process.env.JOBS_ENABLED.toLowerCase();
    if (jobsEnabled !== 'true' && jobsEnabled !== 'false') {
      errors.push('JOBS_ENABLED doit être "true" ou "false"');
    }
  }

  // Validation REDIS_QUEUE_DB (optional)
  if (
    process.env.REDIS_QUEUE_DB !== undefined &&
    process.env.REDIS_QUEUE_DB.trim() !== ''
  ) {
    const redisQueueDb = parseInt(process.env.REDIS_QUEUE_DB, 10);
    if (isNaN(redisQueueDb) || redisQueueDb < 0) {
      errors.push('REDIS_QUEUE_DB doit être un nombre entier >= 0');
    }
  }

  // Validation THROTTLE_TTL_MS
  const throttleTtlMs = parseInt(process.env.THROTTLE_TTL_MS || '0', 10);
  if (isNaN(throttleTtlMs) || throttleTtlMs < 1) {
    errors.push(
      'THROTTLE_TTL_MS doit être un nombre positif (en millisecondes)',
    );
  }

  // Validation THROTTLE_LIMIT
  const throttleLimit = parseInt(process.env.THROTTLE_LIMIT || '0', 10);
  if (isNaN(throttleLimit) || throttleLimit < 1) {
    errors.push('THROTTLE_LIMIT doit être un nombre positif');
  }

  // Validation CORS_ENABLED
  const corsEnabled = process.env.CORS_ENABLED?.toLowerCase();
  if (corsEnabled !== 'true' && corsEnabled !== 'false') {
    errors.push('CORS_ENABLED doit être "true" ou "false"');
  }

  // Validation CORS_CREDENTIALS
  const corsCredentials = process.env.CORS_CREDENTIALS?.toLowerCase();
  if (corsCredentials !== 'true' && corsCredentials !== 'false') {
    errors.push('CORS_CREDENTIALS doit être "true" ou "false"');
  }

  // Validation CORS_MAX_AGE
  const corsMaxAge = parseInt(process.env.CORS_MAX_AGE || '0', 10);
  if (isNaN(corsMaxAge) || corsMaxAge < 0) {
    errors.push('CORS_MAX_AGE doit être un nombre positif (en secondes)');
  }

  // Validation SUPER_ADMIN_EMAIL
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  if (!superAdminEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(superAdminEmail)) {
    errors.push('SUPER_ADMIN_EMAIL doit être une adresse email valide');
  }

  // Validation SUPER_ADMIN_PASSWORD
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
  if (!superAdminPassword || superAdminPassword.length < 8) {
    errors.push(
      'SUPER_ADMIN_PASSWORD doit contenir au moins 8 caractères pour des raisons de sécurité',
    );
  }

  // Validation SUPER_ADMIN_FIRST_NAME
  if (
    !process.env.SUPER_ADMIN_FIRST_NAME ||
    process.env.SUPER_ADMIN_FIRST_NAME.trim().length === 0
  ) {
    errors.push('SUPER_ADMIN_FIRST_NAME ne peut pas être vide');
  }

  // Validation SUPER_ADMIN_LAST_NAME
  if (
    !process.env.SUPER_ADMIN_LAST_NAME ||
    process.env.SUPER_ADMIN_LAST_NAME.trim().length === 0
  ) {
    errors.push('SUPER_ADMIN_LAST_NAME ne peut pas être vide');
  }

  // Validation WORLD_TIME_API_BASE_URL
  const worldTimeApiBaseUrl = process.env.WORLD_TIME_API_BASE_URL?.trim() ?? '';
  if (
    worldTimeApiBaseUrl.length === 0 ||
    !/^https?:\/\/.+/.test(worldTimeApiBaseUrl)
  ) {
    errors.push(
      'WORLD_TIME_API_BASE_URL doit être une URL valide (ex. https://worldtimeapi.org/api)',
    );
  }

  // Validation FRONTEND_BASE_URL
  const frontendBaseUrl = process.env.FRONTEND_BASE_URL?.trim() ?? '';
  if (frontendBaseUrl.length === 0 || !/^https?:\/\/.+/.test(frontendBaseUrl)) {
    errors.push(
      'FRONTEND_BASE_URL doit être une URL valide (ex. http://localhost:5173)',
    );
  }

  // Validation REFRESH_JWT_EXPIRES_IN
  if (
    !process.env.REFRESH_JWT_EXPIRES_IN ||
    process.env.REFRESH_JWT_EXPIRES_IN.trim().length === 0
  ) {
    errors.push('REFRESH_JWT_EXPIRES_IN ne peut pas être vide');
  }

  // Si des erreurs de validation sont trouvées, lancer une exception
  if (errors.length > 0) {
    logger.error("❌ Erreurs de validation des variables d'environnement:");
    errors.forEach((error) => logger.error(`  - ${error}`));
    throw new Error(`Erreurs de validation: ${errors.join('; ')}`);
  }

  // Log de confirmation (sans révéler les secrets)
  logger.log(
    "✅ Toutes les variables d'environnement obligatoires sont présentes et valides",
  );
  logger.log(`PORT: ${process.env.PORT}`);
  logger.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`JWT_EXPIRES_IN: ${process.env.JWT_EXPIRES_IN}`);
  logger.log(`REFRESH_JWT_EXPIRES_IN: ${process.env.REFRESH_JWT_EXPIRES_IN}`);
  logger.log('JWT_SECRET: ✅ Configuré');
  logger.log('REFRESH_JWT_SECRET: ✅ Configuré');
  logger.log('TOKEN_ENCRYPTION_KEY: ✅ Configuré');
  logger.log('API_ACCESS_KEY: ✅ Configurée');
  logger.log('GOOGLE_CLIENT_ID: ✅ Configuré');
  logger.log(`FRONTEND_BASE_URL: ${process.env.FRONTEND_BASE_URL}`);
  logger.log(`MAIL_HOST: ${process.env.MAIL_HOST}`);
  logger.log(`MAIL_PORT: ${process.env.MAIL_PORT}`);
  logger.log(`REDIS_HOST: ${process.env.REDIS_HOST}`);
  logger.log(`REDIS_PORT: ${process.env.REDIS_PORT}`);
  logger.log(`CACHE_ENABLED: ${process.env.CACHE_ENABLED}`);
  logger.log(`THROTTLE_TTL_MS: ${process.env.THROTTLE_TTL_MS}`);
  logger.log(`THROTTLE_LIMIT: ${process.env.THROTTLE_LIMIT}`);
  logger.log(`CORS_ENABLED: ${process.env.CORS_ENABLED}`);
  logger.log(
    `CORS_ORIGINS: ${process.env.CORS_ORIGINS?.split(',').length || 0} origine(s) configurée(s)`,
  );
  logger.log('SUPER_ADMIN_EMAIL: ✅ Configuré');
  logger.log('SUPER_ADMIN_PASSWORD: ✅ Configuré');
  logger.log('SUPER_ADMIN_FIRST_NAME: ✅ Configuré');
  logger.log('SUPER_ADMIN_LAST_NAME: ✅ Configuré');
  logger.log('WORLD_TIME_API_BASE_URL: ✅ Configuré');
}
