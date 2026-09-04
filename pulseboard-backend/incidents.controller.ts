import { Controller, Get } from '@nestjs/common';
import { IncidentsService } from './incidents.service';

@Controller('incidents') 

export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Get()
  async getAllIncidents() {
    return this.incidentsService.findAll();
  }
}
