import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

// 컴포넌트 마운트 시점에 연결을 제어하기 위해 autoConnect는 false로 설정
export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
});