import { io } from 'socket.io-client';
import { SOCKET_URL } from "../apis/config";

/**
 * Socket connection with auth
 * Connects ONLY after user logs in (see AuthContext)
 */
export const socket = io(SOCKET_URL, {
  autoConnect: false, // Don't connect until user logs in
  transports: ["polling", "websocket"],
  withCredentials: true,
  timeout: 8000,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});

/**
 * Update socket auth when user logs in
 * Call this from AuthContext after successful login
 */
export const setSocketAuth = (userId, userEmail) => {
  socket.auth = {
    userId,
    userEmail,
  };

  if (!socket.connected) {
    socket.connect();
  }
};

export const waitForSocketConnection = () => {
  if (socket.connected) {
    return Promise.resolve();
  }

  socket.connect();

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error("Socket connection timed out"));
    }, 8000);

    const cleanup = () => {
      clearTimeout(timeoutId);
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
    };

    const handleConnect = () => {
      cleanup();
      resolve();
    };

    const handleConnectError = (error) => {
      cleanup();
      reject(error);
    };

    socket.once("connect", handleConnect);
    socket.once("connect_error", handleConnectError);
  });
};
