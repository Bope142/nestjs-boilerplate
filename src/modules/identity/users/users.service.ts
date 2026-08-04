import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedActor } from '../../../common/types/authenticated-actor';
import { toPublicUser, type PublicUserDto } from '../mappers/user.mapper';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getMe(actor: AuthenticatedActor): Promise<PublicUserDto> {
    const user = await this.usersRepository.findById(actor.userId);
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'Utilisateur introuvable',
      });
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
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'Utilisateur introuvable',
      });
    }
    return toPublicUser(user);
  }
}
