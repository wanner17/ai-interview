import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
const SOCKET_PATH = process.env.NEXT_PUBLIC_SOCKET_PATH || '/socket.io';

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  path: SOCKET_PATH,
  transports: ['polling', 'websocket'],
  withCredentials: true,
});
