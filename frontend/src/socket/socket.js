import { io } from 'socket.io-client';

let socket;

export const setSocketToken = (token) => {
  if (socket) {
    socket.auth = { token };
  }
};

export const getSocket = () => {
  if (!socket) {
    socket = io('http://localhost:8000', {
      autoConnect: false,
      auth: { token: '' }
    });
  }
  return socket;
};
