import type { AuthUser } from "../auth/auth.types";
import type { ApiPrincipal } from "../developer-api/types";
import type { Request } from "express";

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
    apiPrincipal?: ApiPrincipal;
    campgroundId?: string | null;
    organizationId?: string | null;
    rawBody?: string | Buffer;
  }
}

declare global {
  namespace Express {
    interface User extends AuthUser {}
  }
}
