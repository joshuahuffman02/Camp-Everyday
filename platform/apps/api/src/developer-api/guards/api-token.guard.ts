import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { createHash } from "crypto";
import { ApiPrincipal } from "../types";

@Injectable()
export class ApiTokenGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) { }

  private hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest() as any;
    const authHeader = request.headers["authorization"] as string | undefined;
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }

    const token = authHeader.split(" ")[1];
    if (!token) throw new UnauthorizedException("Missing bearer token");

    const hashed = this.hashToken(token);
    const record = await this.prisma.apiToken.findFirst({
      where: {
        accessTokenHash: hashed,
        revokedAt: null,
        expiresAt: { gt: new Date() },
        apiClient: { isActive: true }
      },
      include: { apiClient: true }
    });

    if (!record || !record.apiClient) {
      throw new UnauthorizedException("Invalid or expired token");
    }

    const principal: ApiPrincipal = {
      apiClientId: record.apiClientId,
      tokenId: record.id,
      campgroundId: record.apiClient.campgroundId,
      scopes: record.scopes || []
    };

    request.apiPrincipal = principal;
    request.campgroundId = principal.campgroundId;

    return true;
  }
}

