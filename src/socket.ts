import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';

// Track online users: userId -> socketId
export const onlineUsers = new Map<string, string>();

let ioInstance: Server | null = null;

export const initSocket = (server: HttpServer, allowedOrigins: string[]) => {
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      credentials: true
    }
  });

  ioInstance = io;

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // User joins a room named after their userId
    socket.on('join', (userId: string) => {
      if (userId) {
        socket.join(userId);
        onlineUsers.set(userId, socket.id);
        console.log(`[Socket] User ${userId} is online (socket: ${socket.id})`);
        
        // Broadcast user's online status to everyone
        io.emit('user_status', { userId, isOnline: true });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
      
      // Find and remove disconnected user
      let disconnectedUserId: string | null = null;
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          disconnectedUserId = userId;
          onlineUsers.delete(userId);
          break;
        }
      }

      if (disconnectedUserId) {
        console.log(`[Socket] User ${disconnectedUserId} is offline`);
        
        // Broadcast user's offline status to everyone
        io.emit('user_status', { userId: disconnectedUserId, isOnline: false });
      }
    });
  });

  return io;
};

// Helper to notify a specific user
export const notifyUser = (userId: string, event: string, data: any) => {
  if (ioInstance) {
    ioInstance.to(userId).emit(event, data);
  }
};

// Helper to broadcast status changes
export const broadcastEvent = (event: string, data: any) => {
  if (ioInstance) {
    ioInstance.emit(event, data);
  }
};
