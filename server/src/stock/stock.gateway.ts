import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { StockService, SubscribeItem } from './stock.service';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class StockGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(StockGateway.name);
  private clientSubscriptions = new Map<string, SubscribeItem[]>();
  private pollingIntervals = new Map<string, NodeJS.Timeout>();

  constructor(private readonly stockService: StockService) {}

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.clientSubscriptions.delete(client.id);
    this.cleanupPolling(client.id);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() items: SubscribeItem[],
  ) {
    const validItems = items.filter(
      (item) =>
        (item.category === 'stock' && /^[\dA-Z]{6,7}$/.test(item.code)) ||
        item.category === 'index',
    );

    this.logger.log(
      `Client ${client.id} subscribing to: ${validItems.map((i) => i.code).join(', ')}`,
    );

    this.clientSubscriptions.set(client.id, validItems);

    this.sendImmediateUpdate(client, validItems);
    this.startPolling(client);

    return { event: 'subscribed', data: validItems };
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(@ConnectedSocket() client: Socket) {
    this.clientSubscriptions.delete(client.id);
    this.cleanupPolling(client.id);
    return { event: 'unsubscribed' };
  }

  private async sendImmediateUpdate(
    client: Socket,
    items: SubscribeItem[],
  ) {
    if (items.length === 0) return;
    const prices = await this.stockService.getMultiplePrices(items);
    client.emit('stockUpdate', prices);
  }

  private startPolling(client: Socket) {
    this.cleanupPolling(client.id);

    const interval = setInterval(async () => {
      const items = this.clientSubscriptions.get(client.id);
      if (!items || items.length === 0) return;

      const prices = await this.stockService.getMultiplePrices(items);
      client.emit('stockUpdate', prices);
    }, 5000);

    this.pollingIntervals.set(client.id, interval);
  }

  private cleanupPolling(clientId: string) {
    const interval = this.pollingIntervals.get(clientId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(clientId);
    }
  }
}
