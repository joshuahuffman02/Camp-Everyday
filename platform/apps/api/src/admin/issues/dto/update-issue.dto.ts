import { IsString, IsOptional, IsEnum, MaxLength } from "class-validator";
import { IssueCategory, IssuePriority, IssueStatus } from "@prisma/client";

export class UpdateIssueDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsEnum(IssueCategory)
  category?: IssueCategory;

  @IsOptional()
  @IsEnum(IssuePriority)
  priority?: IssuePriority;

  @IsOptional()
  @IsEnum(IssueStatus)
  status?: IssueStatus;

  @IsOptional()
  @IsString()
  assignedTo?: string;
}
