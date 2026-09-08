import { io, Socket } from 'socket.io-client';
import { tokenStore } from './api';

let socket: Socket | null = null;

export function getSocketClient(): Socket {
  if (!socket) {
    const token = tokenStore.get();
    socket = io('http://localhost:3001', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      withCredentials: true,
      auth: {
        token: token || '',
      },
    });

    socket.on('connect', () => {
      console.log('⚡ Authenticated Socket.io connected to backend:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('⚡ Socket.io disconnected');
    });
  }

  return socket;
}
