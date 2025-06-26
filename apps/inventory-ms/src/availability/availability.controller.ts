import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { AvailabilityService } from './availability.service';

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get('schedule/:scheduleId')
  getSeatAvailability(@Param('scheduleId', ParseIntPipe) scheduleId: number) {
    return this.availabilityService.getSeatAvailability(scheduleId);
  }
}
