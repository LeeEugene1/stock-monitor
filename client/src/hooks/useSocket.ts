import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { StockPrice, SubscribeItem } from '../types/stock';

const SERVER_URL = window.location.origin;

export function useSocket(subscribeItems: SubscribeItem[]) {
  const socketRef = useRef<Socket | null>(null);
  const [prices, setPrices] = useState<Map<string, StockPrice>>(new Map());
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(SERVER_URL, { withCredentials: true });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('stockUpdate', (data: StockPrice[]) => {
      setPrices((prev) => {
        const next = new Map(prev);
        data.forEach((stock) => next.set(stock.code, stock));
        return next;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !connected || subscribeItems.length === 0) return;

    socket.emit('subscribe', subscribeItems);

    return () => {
      socket.emit('unsubscribe');
    };
  }, [subscribeItems, connected]);

  const removePrice = useCallback((code: string) => {
    setPrices((prev) => {
      const next = new Map(prev);
      next.delete(code);
      return next;
    });
  }, []);

  return { prices, connected, removePrice };
}
