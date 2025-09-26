import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';

import { WorkshopsService } from './workshops.service';

@Controller('workshops')
export class WorkshopsController {
  constructor(private readonly workshops: WorkshopsService) {}

  @Get()
  findAll() {
    return this.workshops.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.workshops.findOne(id);
  }
}
