import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTrainDto } from './dto/create-train.dto';
import { UpdateTrainDto } from './dto/update-train.dto';

@Injectable()
export class TrainService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateTrainDto) {
    // Check if train number already exists
    const existingTrain = await this.prisma.train.findUnique({
      where: { trainNumber: data.trainNumber },
    });
    if (existingTrain) {
      throw new ConflictException('Train with this number already exists');
    }

    return this.prisma.train.create({ data });
  }

  async findAll() {
    return this.prisma.train.findMany({
      orderBy: { trainNumber: 'asc' },
    });
  }

  async findOne(id: number) {
    const train = await this.prisma.train.findUnique({
      where: { id },
    });
    if (!train) {
      throw new NotFoundException(`Train with ID ${id} not found`);
    }
    return train;
  }

  async findByNumber(trainNumber: string) {
    const train = await this.prisma.train.findUnique({
      where: { trainNumber },
    });
    if (!train) {
      throw new NotFoundException(`Train with number ${trainNumber} not found`);
    }
    return train;
  }

  async update(id: number, data: UpdateTrainDto) {
    // Check if train exists
    const existingTrain = await this.prisma.train.findUnique({
      where: { id },
    });
    if (!existingTrain) {
      throw new NotFoundException(`Train with ID ${id} not found`);
    }

    // Check train number uniqueness if number is being updated
    if (data.trainNumber && data.trainNumber !== existingTrain.trainNumber) {
      const trainWithNumber = await this.prisma.train.findUnique({
        where: { trainNumber: data.trainNumber },
      });
      if (trainWithNumber) {
        throw new ConflictException('Train with this number already exists');
      }
    }

    return this.prisma.train.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    // Check if train exists
    const existingTrain = await this.prisma.train.findUnique({
      where: { id },
    });
    if (!existingTrain) {
      throw new NotFoundException(`Train with ID ${id} not found`);
    }

    return this.prisma.train.delete({
      where: { id },
    });
  }

  // Internal service communication methods
  async validateTrain(id: number): Promise<boolean> {
    const train = await this.prisma.train.findUnique({
      where: { id },
    });
    return !!train;
  }

  async getTrainDetails(id: number) {
    return this.findOne(id);
  }

  async getActiveTrains() {
    return this.prisma.train.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { trainNumber: 'asc' },
    });
  }

  async searchTrains(query: string) {
    return this.prisma.train.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { trainNumber: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { trainNumber: 'asc' },
    });
  }

  async getTrainSchedules(id: number) {
    const train = await this.prisma.train.findUnique({
      where: { id },
      include: {
        schedules: {
          include: {
            departureStation: true,
            arrivalStation: true,
          },
          orderBy: { departureTime: 'asc' },
        },
      },
    });
    if (!train) {
      throw new NotFoundException(`Train with ID ${id} not found`);
    }
    return train;
  }
}
