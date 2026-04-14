import { io, Socket } from 'socket.io-client';

// 1. URL 끝에 슬래시(/)를 넣지 마세요.
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://api.eisoft.co.kr:543';

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  // 2. Nginx의 location 경로와 소켓의 기본 경로(/socket.io)를 합쳐야 합니다.
  path: '/interview-api/socket.io', 
  // 3. transports 설정
  transports: ['polling', 'websocket'], 
  withCredentials: true,
});