import { IsString, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { TrainType } from './create-train.dto';

export enum TrainStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
}

export class UpdateTrainDto {
  @IsOptional()
  @IsString()
  trainNumber?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(TrainType)
  type?: TrainType;

  @IsOptional()
  @IsNumber()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsEnum(TrainStatus)
  status?: TrainStatus;
}
