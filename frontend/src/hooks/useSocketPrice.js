import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function useSocketPrice(symbol) {
  const [price, setPrice] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!symbol) return;
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL, { transports: ['websocket'] });
    }
    const socket = socketRef.current;
    socket.emit('subscribe', symbol);
    const handlePriceUpdate = (data) => {
      if (data.instrument === symbol) setPrice(data.last_price);
    };
    socket.on('priceUpdate', handlePriceUpdate);
    return () => {
      socket.emit('unsubscribe', symbol);
      socket.off('priceUpdate', handlePriceUpdate);
    };
  }, [symbol]);

  return price;
} 