import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
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
import { CurrentActor } from '../../../common/decorators/current-actor.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ApiKeyGuard } from '../../../common/guards/api-key.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import type { AuthenticatedActor } from '../../../common/types/authenticated-actor';
import { ListInAppNotificationsQueryDto } from './dto/list-in-app-notifications-query.dto';
import { NotificationsService } from './notifications.service';

const ALL_AUTH_ROLES = ['SUPER_ADMIN', 'ADMIN', 'USER'] as const;

@ApiTags('In-App Notifications')
@ApiHeader({ name: 'x-api-key', required: true })
@ApiBearerAuth()
@UseGuards(ApiKeyGuard, JwtAuthGuard, RolesGuard)
@Controller('communication/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('me')
  @Roles(...ALL_AUTH_ROLES)
  @ApiOperation({ summary: 'Lister mes notifications in-app' })
  listMine(
    @CurrentActor() actor: AuthenticatedActor,
    @Query() query: ListInAppNotificationsQueryDto,
  ) {
    return this.notificationsService.listForUser(actor.userId, query);
  }

  @Post(':id/read')
  @Roles(...ALL_AUTH_ROLES)
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  markRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.notificationsService.markRead(id, actor.userId);
  }
}
