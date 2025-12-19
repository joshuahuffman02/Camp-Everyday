import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested } from "class-validator";

export class MapShapeDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsObject()
  @IsNotEmpty()
  geometry!: Record<string, any>;

  @IsOptional()
  @IsObject()
  centroid?: Record<string, any>;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpsertMapShapesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MapShapeDto)
  shapes!: MapShapeDto[];
}
