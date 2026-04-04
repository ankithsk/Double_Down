import { io } from 'socket.io-client';

// In production (Vercel), VITE_SERVER_URL points to the Railway backend.
// In dev, connect to '/' so Vite proxy handles it.
const SERVER_URL = import.meta.env.VITE_SERVER_URL || '/';

const socket = io(SERVER_URL, {
  autoConnect: false,
  auth: {},
});

export default socket;
