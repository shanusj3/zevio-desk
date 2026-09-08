import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { logger } from "../config/logger.js";
import { jwtService } from "../services/jwt.service.js";

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    tenantId: string;
    role: string;
  };
}

let io: Server | null = null;

export function initSocketServer(server: HttpServer): Server {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    },
  });

  // Handshake JWT Authentication Middleware
  io.use((socket: AuthenticatedSocket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers?.authorization
          ? socket.handshake.headers.authorization.replace("Bearer ", "")
          : null);

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const payload = jwtService.verify(token);
      if (!payload || !payload.id || !payload.tenantId) {
        return next(new Error("Authentication error: Invalid token payload"));
      }

      socket.user = {
        id: payload.id,
        tenantId: payload.tenantId,
        role: payload.role,
      };

      next();
    } catch (err: any) {
      logger.error(`⚡ Socket authentication failed: ${err.message}`);
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    const user = socket.user;
    if (!user) return;

    logger.info(`⚡ Authenticated socket connected: user ${user.id} (tenant ${user.tenantId})`);

    // Automatically join server-derived rooms
    socket.join(`user:${user.id}`);
    socket.join(`tenant:${user.tenantId}`);

    socket.on("disconnect", () => {
      logger.info(`⚡ Socket disconnected for user: ${user.id}`);
    });
  });

  return io;
}

export function getSocketIO(): Server | null {
  return io;
}

export function emitTicketAssigned(data: any) {
  if (!io) return;
  const assignedToId = data?.assignedToId;
  const tenantId = data?.tenantId;

  logger.info(`⚡ Broadcasting ticket:assigned event to target user:${assignedToId} & tenant:${tenantId}`);

  if (assignedToId) {
    // Send targeted real-time socket event to the assigned technician
    io.to(`user:${assignedToId}`).emit("ticket:assigned", {
      ...data,
      isDirectAssignment: true,
    });
    // Also notify tenant-wide room for dashboard & advisor table updates
    if (tenantId) {
      io.to(`tenant:${tenantId}`).emit("ticket:assigned", data);
    }
  } else if (tenantId) {
    io.to(`tenant:${tenantId}`).emit("ticket:assigned", data);
  } else {
    io.emit("ticket:assigned", data);
  }
}
