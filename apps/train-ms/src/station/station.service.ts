import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStationDto } from './dto/create-station.dto';
import { UpdateStationDto } from './dto/update-station.dto';

@Injectable()
export class StationService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateStationDto) {
    // Check if station code already exists
    const existingStation = await this.prisma.station.findUnique({
      where: { code: data.code },
    });
    if (existingStation) {
      throw new ConflictException('Station with this code already exists');
    }

    return this.prisma.station.create({ data });
  }

  async findAll() {
    return this.prisma.station.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const station = await this.prisma.station.findUnique({
      where: { id },
    });
    if (!station) {
      throw new NotFoundException(`Station with ID ${id} not found`);
    }
    return station;
  }

  async findByCode(code: string) {
    const station = await this.prisma.station.findUnique({
      where: { code },
    });
    if (!station) {
      throw new NotFoundException(`Station with code ${code} not found`);
    }
    return station;
  }

  async update(id: number, data: UpdateStationDto) {
    // Check if station exists
    const existingStation = await this.prisma.station.findUnique({
      where: { id },
    });
    if (!existingStation) {
      throw new NotFoundException(`Station with ID ${id} not found`);
    }

    // Check code uniqueness if code is being updated
    if (data.code && data.code !== existingStation.code) {
      const stationWithCode = await this.prisma.station.findUnique({
        where: { code: data.code },
      });
      if (stationWithCode) {
        throw new ConflictException('Station with this code already exists');
      }
    }

    return this.prisma.station.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    // Check if station exists
    const existingStation = await this.prisma.station.findUnique({
      where: { id },
    });
    if (!existingStation) {
      throw new NotFoundException(`Station with ID ${id} not found`);
    }

    return this.prisma.station.delete({
      where: { id },
    });
  }

  // Internal service communication methods
  async validateStation(id: number): Promise<boolean> {
    const station = await this.prisma.station.findUnique({
      where: { id },
    });
    return !!station;
  }

  async getStationDetails(id: number) {
    return this.findOne(id);
  }

  async searchStations(query: string) {
    return this.prisma.station.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { code: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { name: 'asc' },
    });
  }
}
