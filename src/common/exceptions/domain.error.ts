import { HttpException, HttpStatus } from '@nestjs/common';

export type DomainErrorOptions = {
  args?: Record<string, unknown>;
};

/**
 * Domain failure with a stable machine `code`.
 * Human `message` is translated in AllExceptionsFilter via i18n.
 */
export class DomainError extends HttpException {
  readonly code: string;
  readonly args?: Record<string, unknown>;

  constructor(
    code: string,
    status: HttpStatus | number = HttpStatus.BAD_REQUEST,
    options?: DomainErrorOptions,
  ) {
    super({ code, message: code }, status);
    this.code = code;
    this.args = options?.args;
  }
}
