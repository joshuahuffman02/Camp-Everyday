import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ApiScope } from "./types";
import { randomBytes, createHash } from "crypto";
import * as bcrypt from "bcryptjs";

const DEFAULT_SCOPES: ApiScope[] = [
  "reservations:read",
  "reservations:write",
  "guests:read",
  "guests:write",
  "sites:read",
  "sites:write",
  "webhooks:read",
  "webhooks:write",
  "tokens:read",
  "tokens:write",
];

@Injectable()
export class ApiAuthService {
  private accessTtlSeconds = 3600;

  constructor(private readonly prisma: PrismaService) { }

  private hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }

  private pickScopes(requested: string | undefined, allowed: string[]): string[] {
    if (!requested) return allowed;
    const requestedList = requested.split(" ").map(s => s.trim()).filter(Boolean);
    const allowedSet = new Set(allowed);
    const filtered = requestedList.filter(scope => allowedSet.has(scope));
    return filtered.length ? filtered : allowed;
  }

  private async validateClient(clientId: string, clientSecret: string) {
    const client = await this.prisma.apiClient.findUnique({ where: { clientId } });
    if (!client || !client.isActive) throw new UnauthorizedException("Invalid client");
    const match = await bcrypt.compare(clientSecret, client.clientSecretHash);
    if (!match) throw new UnauthorizedException("Invalid client");
    return client;
  }

  private async persistToken(apiClientId: string, scopes: string[]) {
    const accessToken = randomBytes(32).toString("hex");
    const refreshToken = randomBytes(48).toString("hex");
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.accessTtlSeconds * 1000);

    await this.prisma.apiToken.create({
      data: {
        apiClientId,
        accessTokenHash: this.hashToken(accessToken),
        refreshTokenHash: this.hashToken(refreshToken),
        scopes,
        expiresAt
      }
    });

    return { accessToken, refreshToken, expiresAt };
  }

  async issueClientCredentialsToken(opts: { clientId: string; clientSecret: string; scope?: string }) {
    const client = await this.validateClient(opts.clientId, opts.clientSecret);
    const scopes = this.pickScopes(opts.scope, client.scopes || []);
    const tokens = await this.persistToken(client.id, scopes);

    return {
      token_type: "Bearer",
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_in: this.accessTtlSeconds,
      scope: scopes.join(" "),
      campground_id: client.campgroundId
    };
  }

  async refreshAccessToken(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const token = await this.prisma.apiToken.findFirst({
      where: { refreshTokenHash: tokenHash, revokedAt: null },
      include: { apiClient: true }
    });
    if (!token || !token.apiClient || !token.apiClient.isActive) {
      throw new UnauthorizedException("Invalid refresh token");
    }
    const scopes = token.scopes || token.apiClient.scopes || [];
    const tokens = await this.persistToken(token.apiClientId, scopes);

    return {
      token_type: "Bearer",
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_in: this.accessTtlSeconds,
      scope: scopes.join(" "),
      campground_id: token.apiClient.campgroundId
    };
  }

  async createClient(input: { campgroundId: string; name: string; scopes?: ApiScope[] }) {
    const clientId = `cg_${randomBytes(6).toString("hex")}`;
    const clientSecret = randomBytes(24).toString("hex");
    const hashedSecret = await bcrypt.hash(clientSecret, 12);
    const scopes = (input.scopes && input.scopes.length ? input.scopes : DEFAULT_SCOPES) as string[];

    const client = await this.prisma.apiClient.create({
      data: {
        campgroundId: input.campgroundId,
        name: input.name,
        clientId,
        clientSecretHash: hashedSecret,
        scopes
      }
    });

    return { client, clientSecret };
  }

  async listClients(campgroundId: string) {
    return this.prisma.apiClient.findMany({
      where: { campgroundId },
      orderBy: { createdAt: "desc" }
    });
  }

  async rotateSecret(clientId: string) {
    const secret = randomBytes(24).toString("hex");
    const hashedSecret = await bcrypt.hash(secret, 12);
    const client = await this.prisma.apiClient.update({
      where: { id: clientId },
      data: { clientSecretHash: hashedSecret }
    });
    return { client, clientSecret: secret };
  }

  async setClientActive(clientId: string, isActive: boolean) {
    return this.prisma.apiClient.update({
      where: { id: clientId },
      data: { isActive }
    });
  }

  async revokeToken(tokenId: string) {
    return this.prisma.apiToken.update({
      where: { id: tokenId },
      data: { revokedAt: new Date() }
    });
  }

  async deleteClient(clientId: string) {
    await this.prisma.apiToken.deleteMany({ where: { apiClientId: clientId } });
    return this.prisma.apiClient.delete({ where: { id: clientId } });
  }

  getDefaultScopes(): ApiScope[] {
    return DEFAULT_SCOPES;
  }
}

