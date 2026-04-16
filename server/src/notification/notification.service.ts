import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Notification, NotificationType } from './notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
  ) {}

  async create(data: {
    type: NotificationType;
    title: string;
    body: string;
    ruleId?: number;
  }): Promise<Notification> {
    return this.repo.save(
      this.repo.create({
        type: data.type,
        title: data.title,
        body: data.body,
        ruleId: data.ruleId ?? null,
      }),
    );
  }

  findAll(limit: number = 50): Promise<Notification[]> {
    return this.repo.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  countUnread(): Promise<number> {
    return this.repo.count({ where: { readAt: IsNull() } });
  }

  async markAsRead(id: number): Promise<void> {
    await this.repo.update(id, { readAt: new Date() });
  }

  async markAllAsRead(): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update()
      .set({ readAt: new Date() })
      .where('read_at IS NULL')
      .execute();
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
