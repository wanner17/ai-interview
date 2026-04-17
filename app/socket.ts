import { io, Socket } from 'socket.io-client';

//운영용
// const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://api.eisoft.co.kr:543';

//개발용
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
const SOCKET_PATH = process.env.NEXT_PUBLIC_SOCKET_PATH || '/socket.io';

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  //운영용
  // path: '/interview-api/socket.io', 

  //개발용
  path: SOCKET_PATH,
  
  transports: ['polling', 'websocket'],
  withCredentials: true,
});