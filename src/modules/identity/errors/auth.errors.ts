import {
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';

export function invalidCredentials(): never {
  throw new UnauthorizedException({
    code: 'INVALID_CREDENTIALS',
    message: 'Email ou mot de passe incorrect',
  });
}

export function emailNotVerified(): never {
  throw new ForbiddenException({
    code: 'EMAIL_NOT_VERIFIED',
    message:
      "L'adresse e-mail doit être vérifiée pour accéder à cette ressource",
  });
}

export function emailAlreadyRegistered(): never {
  throw new ConflictException({
    code: 'EMAIL_ALREADY_REGISTERED',
    message: 'Un compte avec cet e-mail existe déjà',
  });
}

export function invalidOrExpiredToken(
  code = 'INVALID_OR_EXPIRED_TOKEN',
): never {
  throw new UnauthorizedException({
    code,
    message: 'Jeton invalide ou expiré',
  });
}

export function invalidRefreshToken(): never {
  throw new UnauthorizedException({
    code: 'INVALID_REFRESH_TOKEN',
    message: 'Jeton de rafraîchissement invalide ou expiré',
  });
}
