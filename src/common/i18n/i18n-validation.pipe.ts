import {
  ArgumentMetadata,
  Injectable,
  ValidationError,
  ValidationPipe,
  ValidationPipeOptions,
} from '@nestjs/common';
import {
  I18nContext,
  I18nValidationException,
  i18nValidationErrorFactory,
} from 'nestjs-i18n';

export type AppI18nValidationPipeOptions = Omit<
  ValidationPipeOptions,
  'exceptionFactory'
>;

function isI18nMessage(message: string): boolean {
  return message.includes('|') || message.startsWith('validation.');
}

function extractConstraintValues(
  constraintName: string,
  originalMessage: string,
): unknown[] {
  if (
    constraintName === 'minLength' ||
    constraintName === 'maxLength' ||
    constraintName === 'min' ||
    constraintName === 'max' ||
    constraintName === 'arrayMinSize' ||
    constraintName === 'arrayMaxSize'
  ) {
    const match = originalMessage.match(/(\d+(?:\.\d+)?)/);
    if (match) {
      return [Number(match[1])];
    }
  }
  return [];
}

/**
 * Maps class-validator constraints to validation.<name> when the message is not
 * already an i18n key (preserves i18nValidationMessage(...) custom messages).
 */
function mapConstraintsToI18nKeys(
  errors: ValidationError[],
): ValidationError[] {
  return errors.map((error) => {
    const children = error.children?.length
      ? mapConstraintsToI18nKeys(error.children)
      : error.children;

    if (!error.constraints) {
      return { ...error, children };
    }

    const constraints: Record<string, string> = {};
    for (const [constraintName, message] of Object.entries(error.constraints)) {
      if (isI18nMessage(message)) {
        constraints[constraintName] = message;
        continue;
      }

      constraints[constraintName] =
        `validation.${constraintName}|${JSON.stringify({
          constraints: extractConstraintValues(constraintName, message),
        })}`;
    }

    return { ...error, constraints, children };
  });
}

function appI18nValidationErrorFactory(
  errors: ValidationError[],
): I18nValidationException {
  return i18nValidationErrorFactory(mapConstraintsToI18nKeys(errors));
}

@Injectable()
export class AppI18nValidationPipe extends ValidationPipe {
  constructor(options?: AppI18nValidationPipeOptions) {
    super({
      ...options,
      exceptionFactory: appI18nValidationErrorFactory,
    });
  }

  protected toValidate(metadata: ArgumentMetadata): boolean {
    const { metatype } = metadata;
    return metatype !== I18nContext && super.toValidate(metadata);
  }
}
