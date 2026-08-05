import { Logger } from '@nestjs/common';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { resolveErrorI18nKey } from './resolve-error-i18n-key';

const FALLBACK_LANGUAGE = 'fr';
const logger = new Logger('I18nTranslate');

type TranslateArgs = Record<string, unknown>;

function getI18nService(): I18nService | undefined {
  return I18nContext.current()?.service;
}

function getLang(preferred?: string): string {
  if (preferred) {
    return preferred;
  }
  return I18nContext.current()?.lang ?? FALLBACK_LANGUAGE;
}

/**
 * Translates an i18n key using the current request context, with French fallback.
 */
export function translateKey(
  key: string,
  args?: TranslateArgs,
  lang?: string,
): string {
  const service = getI18nService();
  const resolvedLang = getLang(lang);

  if (!service) {
    logger.warn(`I18nService unavailable for key "${key}"`);
    return key;
  }

  const translated = String(
    service.translate(key, {
      lang: resolvedLang,
      args,
    }),
  );

  if (translated === key && resolvedLang !== FALLBACK_LANGUAGE) {
    logger.warn(
      `Missing i18n key "${key}" for lang="${resolvedLang}", falling back to ${FALLBACK_LANGUAGE}`,
    );
    const fallback = String(
      service.translate(key, {
        lang: FALLBACK_LANGUAGE,
        args,
      }),
    );
    if (fallback === key) {
      logger.warn(
        `Missing i18n key "${key}" for fallback lang="${FALLBACK_LANGUAGE}"`,
      );
      return key;
    }
    return fallback;
  }

  if (translated === key) {
    logger.warn(`Missing i18n key "${key}" for lang="${resolvedLang}"`);
  }

  return translated;
}

export function translateError(
  messageKey: string,
  args?: TranslateArgs,
  lang?: string,
): string {
  return translateKey(resolveErrorI18nKey(messageKey), args, lang);
}

export function translateSuccess(
  messageKey: string,
  args?: TranslateArgs,
  lang?: string,
): string {
  return translateKey(`success.${messageKey}`, args, lang);
}

export function translateCommon(
  messageKey: string,
  args?: TranslateArgs,
  lang?: string,
): string {
  return translateKey(`common.${messageKey}`, args, lang);
}
