import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const ISSUER = "zevio-desk";
const AUDIENCE = "zevio-desk-api";

export interface JwtPayload {
  id: string;
  email: string;
  tenantId: string | null;
  role: string;
  name: string;
  [key: string]: any;
}

export const jwtService = {
  sign: (payload: JwtPayload, expiresIn = "24h"): string => {
    return jwt.sign(payload, env.JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: expiresIn as any,
      issuer: ISSUER,
      audience: AUDIENCE,
    });
  },

  verify: (token: string): JwtPayload => {
    try {
      return jwt.verify(token, env.JWT_SECRET, {
        algorithms: ["HS256"],
        issuer: ISSUER,
        audience: AUDIENCE,
      }) as JwtPayload;
    } catch (err: any) {
      throw new Error(err.message || "Invalid or expired token");
    }
  },
};
