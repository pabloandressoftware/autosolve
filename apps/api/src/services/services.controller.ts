import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';

import { AuthUser } from '../common/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { QueryServicesDto } from './dto/query-services.dto';
import { ServicesService } from './services.service';

@Controller('services')
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

  /** Público: el wireframe permite «Explorar sin cuenta». */
  @Get()
  findAll(@Query() query: QueryServicesDto) {
    return this.services.findAll(query);
  }

  @Get('recommended')
  @UseGuards(OptionalJwtAuthGuard)
  findRecommended(@Req() req: Request & { user?: AuthUser }) {
    return this.services.findRecommended(req.user?.id);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.services.findBySlug(slug);
  }
}
