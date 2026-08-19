import { Request, Response } from "express";
import { authService } from "./auth.service.js";
import { sendSuccess } from "../../utils/response.js";
import { validateLoginPayload } from "./auth.validation.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ValidationError } from "../../errors/AppError.js";

const setAuthCookie = (res: Response, token: string) => {
  res.cookie("zevio_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    domain: process.env.NODE_ENV === "production" ? undefined : ".localhost",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: "/",
  });
};

const setRefreshTokenCookie = (res: Response, token: string) => {
  res.cookie("zevio_refresh_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    domain: process.env.NODE_ENV === "production" ? undefined : ".localhost",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  });
};

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const err = validateLoginPayload(req.body);
    if (err) throw new ValidationError(err);

    const result = await authService.login(req.body);
    setAuthCookie(res, result.accessToken);
    if (result.refreshToken) {
      setRefreshTokenCookie(res, result.refreshToken);
    }
    return sendSuccess(res, { user: result.user, accessToken: result.accessToken }, "Login successful");

  }),

  me: asyncHandler(async (req: any, res: Response) => {
    return sendSuccess(res, req.user, "Current session details");
  }),

  verifySetupToken: asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.query;
    if (!token || typeof token !== "string") {
      throw new ValidationError("Token is required");
    }
    const result = await authService.verifySetupToken(token);
    return sendSuccess(res, result, "Token verification result");
  }),

  setupPassword: asyncHandler(async (req: Request, res: Response) => {
    const { token, password } = req.body;
    if (!token || !password) {
      throw new ValidationError("Token and password are required");
    }
    if (password.length < 6) {
      throw new ValidationError("Password must be at least 6 characters");
    }

    const result = await authService.setupPassword(token, password);
    setAuthCookie(res, result.accessToken);
    if (result.refreshToken) {
      setRefreshTokenCookie(res, result.refreshToken);
    }
    return sendSuccess(res, { user: result.user }, "Password set successfully");
  }),

  refreshToken: asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies.zevio_refresh_token || req.body.refreshToken;
    if (!token) {
      throw new ValidationError("Refresh token is required");
    }
    const result = await authService.refreshToken(token);
    setAuthCookie(res, result.accessToken);
    if (result.refreshToken) {
      setRefreshTokenCookie(res, result.refreshToken);
    }
    return sendSuccess(res, { user: result.user, accessToken: result.accessToken }, "Token refreshed successfully");
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: (process.env.NODE_ENV === "production" ? "strict" : "lax") as "strict" | "lax",
      domain: process.env.NODE_ENV === "production" ? undefined : ".localhost",
      path: "/",
    };
    res.clearCookie("zevio_token", cookieOpts);
    res.clearCookie("zevio_refresh_token", cookieOpts);
    return sendSuccess(res, null, "Logged out successfully");
  }),
};
