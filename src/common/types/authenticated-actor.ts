import type {
  UserRole,
  UserStatus,
  UserType,
} from '../../database/schema/enums';

export type AuthenticatedActor = {
  userId: string;
  email: string;
  role: UserRole;
  userType: UserType;
  status: UserStatus;
  sessionId: string;
  emailVerified: boolean;
};
