import type { AuthUser } from "../auth/auth.types";
import type { Request } from "express";

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
    campgroundId?: string | null;
    organizationId?: string | null;
  }
}
