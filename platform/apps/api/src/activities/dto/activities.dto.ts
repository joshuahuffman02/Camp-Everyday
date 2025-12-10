import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, Min } from 'class-validator';

/**
 * DTO for creating a new activity
 */
export class CreateActivityDto {
    @IsString()
    campgroundId!: string;

    @IsString()
    name!: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsNumber()
    @Min(0)
    price!: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    duration?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    capacity?: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    images?: string[];
}

/**
 * DTO for updating an existing activity
 */
export class UpdateActivityDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    price?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    duration?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    capacity?: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    images?: string[];
}

/**
 * DTO for creating a session for an activity
 */
export class CreateSessionDto {
    @IsString()
    startTime!: string;

    @IsString()
    endTime!: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    capacity?: number;
}

/**
 * DTO for booking an activity session
 */
export class BookActivityDto {
    @IsString()
    guestId!: string;

    @IsNumber()
    @Min(1)
    quantity!: number;

    @IsOptional()
    @IsString()
    reservationId?: string;
}

export class UpdateCapacityDto {
    @IsOptional()
    @IsNumber()
    @Min(1)
    capacity?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    booked?: number;

    @IsOptional()
    @IsBoolean()
    waitlistEnabled?: boolean;
}

export class AddWaitlistEntryDto {
    @IsString()
    guestName!: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    partySize?: number;

    @IsOptional()
    @IsString()
    contact?: string;
}

