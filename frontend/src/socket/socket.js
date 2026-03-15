import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000';

let socket;

export const setSocketToken = (token) => {
  if (socket) {
    socket.auth = { token };
  }
};

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['polling'],
      auth: { token: '' }
    });
  }
  return socket;
};
