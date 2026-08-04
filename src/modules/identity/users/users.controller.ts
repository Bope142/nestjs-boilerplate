import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentActor } from '../../../common/decorators/current-actor.decorator';
import { ApiKeyGuard } from '../../../common/guards/api-key.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import type { AuthenticatedActor } from '../../../common/types/authenticated-actor';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiHeader({ name: 'x-api-key', required: true })
@ApiBearerAuth()
@UseGuards(ApiKeyGuard, JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obtenir l’utilisateur authentifié courant' })
  me(@CurrentActor() actor: AuthenticatedActor) {
    return this.usersService.getMe(actor);
  }
}
