import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('api/notifications')
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Get()
  async list() {
    const [items, unread] = await Promise.all([
      this.service.findAll(),
      this.service.countUnread(),
    ]);
    return { items, unread };
  }

  @Post(':id/read')
  read(@Param('id', ParseIntPipe) id: number) {
    return this.service.markAsRead(id);
  }

  @Post('read-all')
  readAll() {
    return this.service.markAllAsRead();
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
