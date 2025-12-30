import { IsString, IsOptional, IsEnum, MaxLength } from "class-validator";
import { IssueCategory, IssuePriority } from "@prisma/client";

export class CreateIssueDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsEnum(IssueCategory)
  category: IssueCategory;

  @IsOptional()
  @IsEnum(IssuePriority)
  priority?: IssuePriority;

  @IsOptional()
  @IsString()
  assignedTo?: string;
}
