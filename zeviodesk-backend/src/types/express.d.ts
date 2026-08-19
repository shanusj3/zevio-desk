import { AuthenticatedUser } from "../interfaces/request.interface.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      tenantId?: string;
    }
  }
}
