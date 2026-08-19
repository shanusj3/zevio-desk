import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createApp } from "./src/app.js";
import { env } from "./src/config/env.js";
import { logger } from "./src/config/logger.js";
import { prisma } from "./src/config/prisma.js";

async function startServer() {
  const app = createApp();
  const PORT = Number(env.PORT) || 3001;

  // Vite middleware setup for Development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    logger.info(`🚀 Node.js Express Server running at http://0.0.0.0:${PORT}`);
    logger.info(`📦 Modular architecture loaded: Auth, User, Tenant, Ticket, Customer, WhatsApp`);
  });

  const gracefulShutdown = async (signal: string) => {
    logger.info(`\n${signal} signal received: closing HTTP server...`);
    server.close(async () => {
      logger.info("HTTP server closed.");
      try {
        await prisma.$disconnect();
        logger.info("Database connection closed.");
        process.exit(0);
      } catch (err) {
        logger.error("Error during database disconnection:", err);
        process.exit(1);
      }
    });

    // Fallback timeout
    setTimeout(() => {
      logger.error("Could not close connections in time, forcefully shutting down");
      process.exit(1);
    }, 10000).unref();
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
