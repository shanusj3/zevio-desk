import { Request } from "express";

export interface AuthenticatedUser {
  id: string;
  email: string;
  tenantId: string;
  role: string;
  name?: string;
}

export interface CustomRequest extends Request {
  user?: AuthenticatedUser;
  tenantId?: string;
}
