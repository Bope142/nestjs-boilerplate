import { Injectable } from '@nestjs/common';
import type { PaginatedResponse } from '../../../common/types/paginated-response';
import { toPaginatedResponse } from '../../../common/utils/pagination';
import { inAppNotificationNotFound } from '../reminders/errors/reminder.errors';
import { InAppNotificationResponseDto } from './dto/in-app-notification-response.dto';
import { ListInAppNotificationsQueryDto } from './dto/list-in-app-notifications-query.dto';
import {
  NotificationsRepository,
  type CreateInAppNotificationInput,
  type InAppNotificationRow,
} from './notifications.repository';

@Injectable()
export class NotificationsService {
  constructor(private readonly repository: NotificationsRepository) {}

  async listForUser(
    userId: string,
    query: ListInAppNotificationsQueryDto,
  ): Promise<PaginatedResponse<InAppNotificationResponseDto>> {
    const { rows, total } = await this.repository.listForUser(userId, query);
    return toPaginatedResponse(
      rows.map((row) => this.toResponse(row)),
      query.page,
      query.pageSize,
      total,
    );
  }

  async markRead(
    id: string,
    userId: string,
  ): Promise<InAppNotificationResponseDto> {
    const row = await this.repository.markRead(id, userId);
    if (!row) {
      inAppNotificationNotFound();
    }
    return this.toResponse(row);
  }

  /** Used by workers / internal callers. */
  async create(
    input: CreateInAppNotificationInput,
  ): Promise<InAppNotificationResponseDto> {
    const row = await this.repository.create(input);
    return this.toResponse(row);
  }

  private toResponse(row: InAppNotificationRow): InAppNotificationResponseDto {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      body: row.body,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      readAt: row.read_at?.toISOString() ?? null,
      createdAt: row.created_at.toISOString(),
    };
  }
}
