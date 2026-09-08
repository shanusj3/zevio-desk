import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { logger } from "../config/logger.js";

let io: Server | null = null;

export function initSocketServer(server: HttpServer): Server {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    },
  });

  io.on("connection", (socket: Socket) => {
    logger.info(`⚡ Socket client connected: ${socket.id}`);

    socket.on("join", (room: string) => {
      socket.join(room);
      logger.info(`⚡ Socket ${socket.id} joined room: ${room}`);
    });

    socket.on("disconnect", () => {
      logger.info(`⚡ Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getSocketIO(): Server | null {
  return io;
}

export function emitTicketAssigned(data: any) {
  if (!io) return;
  logger.info(`⚡ Broadcasting real-time ticket:assigned event to clients`);
  io.emit("ticket:assigned", data);
  if (data?.assignedToId) {
    io.to(`user:${data.assignedToId}`).emit("ticket:assigned", data);
  }
}
