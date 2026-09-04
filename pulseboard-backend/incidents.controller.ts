import { Controller, Get } from '@nestjs/common';
import { IncidentsService } from './incidents.service';

@Controller('api/incidents') // По этому адресу фронтенд будет забирать JSON!
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Get()
  async getAllIncidents() {
    return this.incidentsService.findAll();
  }
}
