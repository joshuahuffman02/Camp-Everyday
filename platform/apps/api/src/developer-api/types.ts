export type ApiScope =
  | "reservations:read"
  | "reservations:write"
  | "guests:read"
  | "guests:write"
  | "sites:read"
  | "sites:write"
  | "webhooks:write"
  | "webhooks:read"
  | "tokens:read"
  | "tokens:write";

export interface ApiPrincipal {
  apiClientId: string;
  tokenId: string;
  campgroundId: string;
  scopes: string[];
}

