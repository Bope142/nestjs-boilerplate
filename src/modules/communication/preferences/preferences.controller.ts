import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentActor } from '../../../common/decorators/current-actor.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ApiKeyGuard } from '../../../common/guards/api-key.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import type { AuthenticatedActor } from '../../../common/types/authenticated-actor';
import { UpdateNotificationPreferencesDto } from './dto/notification-preferences.dto';
import { PreferencesService } from './preferences.service';

const ALL_AUTH_ROLES = ['SUPER_ADMIN', 'ADMIN', 'USER'] as const;

@ApiTags('Notification Preferences')
@ApiHeader({ name: 'x-api-key', required: true })
@ApiBearerAuth()
@UseGuards(ApiKeyGuard, JwtAuthGuard, RolesGuard)
@Controller('communication/notification-preferences')
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Get('me')
  @Roles(...ALL_AUTH_ROLES)
  @ApiOperation({ summary: 'Obtenir mes préférences de notification' })
  getMine(@CurrentActor() actor: AuthenticatedActor) {
    return this.preferencesService.getForUser(actor.userId);
  }

  @Patch('me')
  @Roles(...ALL_AUTH_ROLES)
  @ApiOperation({ summary: 'Mettre à jour mes préférences de notification' })
  updateMine(
    @Body() dto: UpdateNotificationPreferencesDto,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.preferencesService.updateForUser(actor.userId, dto);
  }
}
