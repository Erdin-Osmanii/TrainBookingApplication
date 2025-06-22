import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateScheduleDto) {
    // Validate that train exists
    const train = await this.prisma.train.findUnique({
      where: { id: data.trainId },
    });
    if (!train) {
      throw new BadRequestException('Train not found');
    }

    // Validate that stations exist
    const departureStation = await this.prisma.station.findUnique({
      where: { id: data.departureStationId },
    });
    if (!departureStation) {
      throw new BadRequestException('Departure station not found');
    }

    const arrivalStation = await this.prisma.station.findUnique({
      where: { id: data.arrivalStationId },
    });
    if (!arrivalStation) {
      throw new BadRequestException('Arrival station not found');
    }

    // Validate that departure and arrival stations are different
    if (data.departureStationId === data.arrivalStationId) {
      throw new BadRequestException(
        'Departure and arrival stations must be different',
      );
    }

    // Validate departure time is before arrival time
    const departureTime = new Date(data.departureTime);
    const arrivalTime = new Date(data.arrivalTime);
    if (departureTime >= arrivalTime) {
      throw new BadRequestException(
        'Departure time must be before arrival time',
      );
    }

    return this.prisma.schedule.create({ data });
  }

  async findAll() {
    return this.prisma.schedule.findMany({
      include: {
        train: true,
        departureStation: true,
        arrivalStation: true,
      },
      orderBy: { departureTime: 'asc' },
    });
  }

  async findOne(id: number) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
      include: {
        train: true,
        departureStation: true,
        arrivalStation: true,
      },
    });
    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }
    return schedule;
  }

  async update(id: number, data: UpdateScheduleDto) {
    // Check if schedule exists
    const existingSchedule = await this.prisma.schedule.findUnique({
      where: { id },
    });
    if (!existingSchedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }

    // Validate train if being updated
    if (data.trainId) {
      const train = await this.prisma.train.findUnique({
        where: { id: data.trainId },
      });
      if (!train) {
        throw new BadRequestException('Train not found');
      }
    }

    // Validate stations if being updated
    if (data.departureStationId) {
      const departureStation = await this.prisma.station.findUnique({
        where: { id: data.departureStationId },
      });
      if (!departureStation) {
        throw new BadRequestException('Departure station not found');
      }
    }

    if (data.arrivalStationId) {
      const arrivalStation = await this.prisma.station.findUnique({
        where: { id: data.arrivalStationId },
      });
      if (!arrivalStation) {
        throw new BadRequestException('Arrival station not found');
      }
    }

    // Validate departure and arrival stations are different
    const departureId =
      data.departureStationId || existingSchedule.departureStationId;
    const arrivalId =
      data.arrivalStationId || existingSchedule.arrivalStationId;
    if (departureId === arrivalId) {
      throw new BadRequestException(
        'Departure and arrival stations must be different',
      );
    }

    // Validate times if being updated
    if (data.departureTime || data.arrivalTime) {
      const departureTime = new Date(
        data.departureTime || existingSchedule.departureTime,
      );
      const arrivalTime = new Date(
        data.arrivalTime || existingSchedule.arrivalTime,
      );
      if (departureTime >= arrivalTime) {
        throw new BadRequestException(
          'Departure time must be before arrival time',
        );
      }
    }

    return this.prisma.schedule.update({
      where: { id },
      data,
      include: {
        train: true,
        departureStation: true,
        arrivalStation: true,
      },
    });
  }

  async remove(id: number) {
    // Check if schedule exists
    const existingSchedule = await this.prisma.schedule.findUnique({
      where: { id },
    });
    if (!existingSchedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }

    return this.prisma.schedule.delete({
      where: { id },
    });
  }

  // Internal service communication methods
  async validateRoute(
    departureStationId: number,
    arrivalStationId: number,
  ): Promise<boolean> {
    const schedule = await this.prisma.schedule.findFirst({
      where: {
        departureStationId,
        arrivalStationId,
        status: 'ACTIVE',
      },
    });
    return !!schedule;
  }

  async getRouteSchedules(
    departureStationId: number,
    arrivalStationId: number,
    date?: string,
  ) {
    const where: {
      departureStationId: number;
      arrivalStationId: number;
      status: string;
      departureTime?: { gte: Date; lt: Date };
    } = {
      departureStationId,
      arrivalStationId,
      status: 'ACTIVE',
    };

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      where.departureTime = {
        gte: startDate,
        lt: endDate,
      };
    }

    return this.prisma.schedule.findMany({
      include: {
        train: true,
        departureStation: true,
        arrivalStation: true,
      },
      orderBy: { departureTime: 'asc' },
    });
  }

  async getAvailableRoutes() {
    return this.prisma.schedule.findMany({
      where: { status: 'ACTIVE' },
      select: {
        departureStationId: true,
        arrivalStationId: true,
        departureStation: {
          select: { name: true, code: true, city: true },
        },
        arrivalStation: {
          select: { name: true, code: true, city: true },
        },
      },
      distinct: ['departureStationId', 'arrivalStationId'],
    });
  }

  async searchSchedules(query: string) {
    return this.prisma.schedule.findMany({
      where: {
        OR: [
          {
            train: {
              name: { contains: query, mode: 'insensitive' },
            },
          },
          {
            train: {
              trainNumber: { contains: query, mode: 'insensitive' },
            },
          },
          {
            departureStation: {
              name: { contains: query, mode: 'insensitive' },
            },
          },
          {
            arrivalStation: {
              name: { contains: query, mode: 'insensitive' },
            },
          },
        ],
      },
      include: {
        train: true,
        departureStation: true,
        arrivalStation: true,
      },
      orderBy: { departureTime: 'asc' },
    });
  }

  async getSchedulesByDate(date: string) {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    return this.prisma.schedule.findMany({
      where: {
        departureTime: {
          gte: startDate,
          lt: endDate,
        },
        status: 'ACTIVE',
      },
      include: {
        train: true,
        departureStation: true,
        arrivalStation: true,
      },
      orderBy: { departureTime: 'asc' },
    });
  }
}
