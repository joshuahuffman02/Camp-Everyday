import { IsOptional, IsString } from "class-validator";

export class MarkPaperSignedDto {
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  paperSignedAt?: string; // ISO date string, defaults to now

  @IsOptional()
  @IsString()
  paperArtifactUrl?: string; // URL to scanned copy

  @IsOptional()
  @IsString()
  notes?: string; // Optional notes about paper signing
}
