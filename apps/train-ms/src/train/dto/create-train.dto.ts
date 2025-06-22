import { IsString, IsNotEmpty, IsEnum, IsNumber, Min } from 'class-validator';

export enum TrainType {
  EXPRESS = 'EXPRESS',
  LOCAL = 'LOCAL',
  FREIGHT = 'FREIGHT',
  HIGH_SPEED = 'HIGH_SPEED',
}

export class CreateTrainDto {
  @IsString()
  @IsNotEmpty()
  trainNumber: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(TrainType)
  type: TrainType;

  @IsNumber()
  @Min(1)
  capacity: number;
}
