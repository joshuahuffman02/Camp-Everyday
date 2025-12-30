import { IsString, IsEnum, MaxLength } from "class-validator";
import { AttemptOutcome } from "@prisma/client";

export class AddAttemptDto {
  @IsString()
  @MaxLength(5000)
  notes: string;

  @IsEnum(AttemptOutcome)
  outcome: AttemptOutcome;
}
