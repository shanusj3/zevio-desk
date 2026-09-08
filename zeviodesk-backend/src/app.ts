import express from "express";
import apiRouter from "./routes/index.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { rateLimitMiddleware } from "./middlewares/rateLimit.middleware.js";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

export function createApp() {
  const app = express();

  // ── CORS must be first — before Helmet and everything else ──────────────────
  app.use((req, res, next) => {
    const origin = req.headers.origin || '';
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      env.FRONTEND_URL,
      env.ALLOWED_ORIGIN,
    ].filter(Boolean) as string[];

    // Also allow any *.localhost origin (e.g. shop1.localhost:3000)
    const isAllowed =
      !origin ||
      allowedOrigins.includes(origin) ||
      /^https?:\/\/(localhost|127\.0\.0\.1|[^.]+\.localhost)(:\d+)?$/i.test(origin) ||
      process.env.NODE_ENV !== 'production';

    if (isAllowed && origin) {
      res.header('Access-Control-Allow-Origin', origin);
    } else if (!origin) {
      res.header('Access-Control-Allow-Origin', '*');
    }
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-tenant-slug, x-tenant-id, X-Tenant-Slug, X-Tenant-Id');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Basic Middlewares
  app.use(helmet({
    // Disable CORP — this header blocks cross-origin resource loading
    crossOriginResourcePolicy: false,
    // Disable COEP — can also interfere with cross-origin requests
    crossOriginEmbedderPolicy: false,
    // CSP is for HTML pages, not API servers — disable to avoid interference
    contentSecurityPolicy: false,
    strictTransportSecurity: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }));
  app.use(
    express.json({
      limit: "2mb",
      verify: (req: any, res, buf) => {
        req.rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ extended: true, limit: "2mb" }));
  app.use(cookieParser());

  // Request Logging
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      let url = req.originalUrl;
      url = url.replace(/token=[^&]+/gi, "token=REDACTED");
      url = url.replace(/password=[^&]+/gi, "password=REDACTED");
      logger.info(`${req.method} ${url} - ${res.statusCode} (${Date.now() - start}ms)`);
    });
    next();
  });

  // Rate Limiting
  app.use(rateLimitMiddleware(150, 60000));

  // API Router Mount
  app.use("/api", apiRouter);

  // Global Error Handler
  app.use(errorMiddleware);

  return app;
}
