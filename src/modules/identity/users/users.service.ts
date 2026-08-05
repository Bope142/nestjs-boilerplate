import { HttpStatus, Injectable } from '@nestjs/common';
import type { AuthenticatedActor } from '../../../common/types/authenticated-actor';
import { DomainError } from '../../../common/exceptions/domain.error';
import { toPublicUser, type PublicUserDto } from '../mappers/user.mapper';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersRepository } from './users.repository';

export const UserErrorCodes = {
  NOT_FOUND: 'USER_NOT_FOUND',
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getMe(actor: AuthenticatedActor): Promise<PublicUserDto> {
    const user = await this.usersRepository.findById(actor.userId);
    if (!user) {
      throw new DomainError(UserErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return toPublicUser(user);
  }

  async create(dto: CreateUserDto): Promise<PublicUserDto> {
    const user = await this.usersRepository.create(dto);
    return toPublicUser(user);
  }

  async update(userId: string, dto: UpdateUserDto): Promise<PublicUserDto> {
    const user = await this.usersRepository.update(userId, dto);
    if (!user) {
      throw new DomainError(UserErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return toPublicUser(user);
  }
}
