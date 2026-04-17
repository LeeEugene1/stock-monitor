import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { StockService, SubscribeItem } from './stock.service';

@WebSocketGateway({
  cors: { origin: true, credentials: true },
})
export class StockGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(StockGateway.name);
  private clientSubscriptions = new Map<string, SubscribeItem[]>();
  private pollingIntervals = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly stockService: StockService,
    private readonly jwtService: JwtService,
  ) {}

  handleConnection(client: Socket) {
    const token = this.extractToken(client);
    if (!token) {
      this.logger.warn(`Socket ${client.id} rejected: no token`);
      client.disconnect(true);
      return;
    }
    try {
      const payload = this.jwtService.verify(token);
      (client.data as { userId?: number }).userId = payload.sub;
    } catch {
      this.logger.warn(`Socket ${client.id} rejected: invalid token`);
      client.disconnect(true);
    }
  }

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

  private extractToken(client: Socket): string | null {
    const authToken = (client.handshake.auth as { token?: string } | undefined)
      ?.token;
    if (authToken) return authToken;

    const cookieHeader = client.handshake.headers.cookie;
    if (!cookieHeader) return null;
    for (const part of cookieHeader.split(';')) {
      const [name, ...rest] = part.trim().split('=');
      if (name === 'auth_token') return decodeURIComponent(rest.join('='));
    }
    return null;
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
