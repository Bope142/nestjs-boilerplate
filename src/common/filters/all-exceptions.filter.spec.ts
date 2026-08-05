import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';
import { DomainError } from '../exceptions/domain.error';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();

  function createHost(acceptLanguage?: string) {
    const headers: Record<string, string> = {};
    if (acceptLanguage) {
      headers['accept-language'] = acceptLanguage;
    }

    const responseHeaders: Record<string, string> = {};
    let statusCode = 0;
    let body: unknown;

    const response = {
      setHeader: (name: string, value: string) => {
        responseHeaders[name.toLowerCase()] = value;
      },
      status: (code: number) => {
        statusCode = code;
        return {
          json: (payload: unknown) => {
            body = payload;
          },
        };
      },
    };

    const request = {
      url: '/api/test',
      headers,
    };

    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => request,
      }),
    } as unknown as ArgumentsHost;

    return {
      host,
      getResult: () => ({
        statusCode,
        body: body as {
          statusCode: number;
          code: string;
          message: string;
          path?: string;
        },
        contentLanguage: responseHeaders['content-language'],
      }),
    };
  }

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('translates DomainError to French by default', () => {
    const translate = jest.fn().mockImplementation((key: string) => {
      if (key === 'errors.auth.AUTH_INVALID_CREDENTIALS') {
        return 'Adresse e-mail ou mot de passe incorrect.';
      }
      return key;
    });

    jest.spyOn(I18nContext, 'current').mockReturnValue({
      lang: 'fr',
      service: { translate },
    } as never);

    const { host, getResult } = createHost();
    filter.catch(
      new DomainError('AUTH_INVALID_CREDENTIALS', HttpStatus.UNAUTHORIZED),
      host,
    );

    const result = getResult();
    expect(result.statusCode).toBe(401);
    expect(result.contentLanguage).toBe('fr');
    expect(result.body).toMatchObject({
      statusCode: 401,
      code: 'AUTH_INVALID_CREDENTIALS',
      message: 'Adresse e-mail ou mot de passe incorrect.',
      path: '/api/test',
    });
  });

  it('translates DomainError to English when Accept-Language is en', () => {
    const translate = jest.fn().mockImplementation((key: string) => {
      if (key === 'errors.auth.AUTH_EMAIL_NOT_VERIFIED') {
        return 'Email address must be verified to access this resource.';
      }
      return key;
    });

    jest.spyOn(I18nContext, 'current').mockReturnValue({
      lang: 'en',
      service: { translate },
    } as never);

    const { host, getResult } = createHost('en');
    filter.catch(
      new DomainError('AUTH_EMAIL_NOT_VERIFIED', HttpStatus.FORBIDDEN),
      host,
    );

    const result = getResult();
    expect(result.statusCode).toBe(403);
    expect(result.contentLanguage).toBe('en');
    expect(result.body).toMatchObject({
      code: 'AUTH_EMAIL_NOT_VERIFIED',
      message: 'Email address must be verified to access this resource.',
    });
  });

  it('falls back to the i18n key when translation is missing', () => {
    const translate = jest.fn().mockImplementation((key: string) => key);

    jest.spyOn(I18nContext, 'current').mockReturnValue({
      lang: 'en',
      service: { translate },
    } as never);

    const { host, getResult } = createHost('en');
    filter.catch(
      new DomainError('AUTH_UNKNOWN_CODE', HttpStatus.BAD_REQUEST),
      host,
    );

    const result = getResult();
    expect(result.body.code).toBe('AUTH_UNKNOWN_CODE');
    expect(result.body.message).toBe('errors.auth.AUTH_UNKNOWN_CODE');
  });
});
