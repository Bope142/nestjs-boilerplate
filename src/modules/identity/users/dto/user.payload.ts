import type {
  UserRole,
  UserStatus,
  UserType,
} from '../../../../database/schema/enums';

/**
 * Persistence/API create contract shared by CreateUserDto and repositories.
 * Plain type (no decorators) so TS/ESLint never resolve class fields as `error`.
 */
export type CreateUserPayload = {
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  userType: UserType;
  role: UserRole;
  status: UserStatus;
  emailVerifiedAt?: Date | null;
};

export type UpdateUserPayload = Partial<CreateUserPayload>;

export type CreateUserDefaultsInput = {
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  emailVerifiedAt?: Date | null;
  userType?: UserType;
  role?: UserRole;
  status?: UserStatus;
};

/**
 * Builds a CreateUserPayload with USER/EXTERNAL/ACTIVE defaults.
 * Kept as a plain function (not a Nest service method) for type-aware ESLint.
 */
export function buildCreateUserPayload(
  input: CreateUserDefaultsInput,
): CreateUserPayload {
  const payload: CreateUserPayload = {
    email: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
    displayName: input.displayName,
    avatarUrl: input.avatarUrl,
    phone: input.phone,
    userType: input.userType ?? 'EXTERNAL',
    role: input.role ?? 'USER',
    status: input.status ?? 'ACTIVE',
    emailVerifiedAt: input.emailVerifiedAt ?? null,
  };
  return payload;
}
