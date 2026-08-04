import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentActor } from '../../../common/decorators/current-actor.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ApiKeyGuard } from '../../../common/guards/api-key.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import type { AuthenticatedActor } from '../../../common/types/authenticated-actor';
import { CancelReminderDto } from './dto/cancel-reminder.dto';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { ListRemindersQueryDto } from './dto/list-reminders-query.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { RemindersService } from './reminders.service';

const ALL_AUTH_ROLES = ['SUPER_ADMIN', 'ADMIN', 'USER'] as const;

const STAFF_ROLES = new Set(['SUPER_ADMIN', 'ADMIN']);

@ApiTags('Reminders')
@ApiHeader({ name: 'x-api-key', required: true })
@ApiBearerAuth()
@UseGuards(ApiKeyGuard, JwtAuthGuard, RolesGuard)
@Controller('communication/reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get()
  @Roles(...ALL_AUTH_ROLES)
  @ApiOperation({ summary: 'Lister les rappels' })
  list(
    @Query() query: ListRemindersQueryDto,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    if (!STAFF_ROLES.has(actor.role)) {
      return this.remindersService.list({ ...query, userId: actor.userId });
    }
    return this.remindersService.list(query);
  }

  @Get(':id')
  @Roles(...ALL_AUTH_ROLES)
  @ApiOperation({ summary: 'Obtenir un rappel' })
  getById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.remindersService.getById(id, actor);
  }

  @Post()
  @Roles(...ALL_AUTH_ROLES)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Créer un rappel' })
  create(
    @Body() dto: CreateReminderDto,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.remindersService.create(dto, actor);
  }

  @Patch(':id')
  @Roles(...ALL_AUTH_ROLES)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Mettre à jour un rappel' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReminderDto,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.remindersService.update(id, dto, actor);
  }

  @Post(':id/pause')
  @Roles(...ALL_AUTH_ROLES)
  @ApiOperation({ summary: 'Mettre un rappel en pause' })
  pause(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.remindersService.pause(id, actor);
  }

  @Post(':id/resume')
  @Roles(...ALL_AUTH_ROLES)
  @ApiOperation({ summary: 'Reprendre un rappel' })
  resume(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.remindersService.resume(id, actor);
  }

  @Post(':id/cancel')
  @Roles(...ALL_AUTH_ROLES)
  @ApiOperation({ summary: 'Annuler un rappel' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelReminderDto,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.remindersService.cancel(id, dto, actor);
  }
}
