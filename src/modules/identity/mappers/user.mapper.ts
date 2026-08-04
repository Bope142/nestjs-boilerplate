import type {
  UserRole,
  UserStatus,
  UserType,
} from '../../../database/schema/enums';
import type { SessionTokenEnvelope } from '../tokens/token.service';
import type { UserRow } from '../users/users.repository';

export type PublicUserDto = {
  email: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  userType: UserType;
  status: UserStatus;
  emailVerified: boolean;
};

export type AuthSessionResponseDto = {
  session: SessionTokenEnvelope;
  user: PublicUserDto;
};

export function toPublicUser(user: UserRow): PublicUserDto {
  return {
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    displayName: user.display_name,
    avatarUrl: user.avatar_url,
    role: user.role,
    userType: user.user_type,
    status: user.status,
    emailVerified: user.email_verified_at != null,
  };
}
