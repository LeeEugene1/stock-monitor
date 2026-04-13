import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WatchItemEntity } from './entities/watch-item.entity';
import { WatchlistController } from './watchlist.controller';
import { WatchlistService } from './watchlist.service';

@Module({
  imports: [TypeOrmModule.forFeature([WatchItemEntity])],
  controllers: [WatchlistController],
  providers: [WatchlistService],
})
export class WatchlistModule {}
