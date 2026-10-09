import { Controller, Post, Get } from '@nestjs/common';
import { SeedService } from './seed.service';

@Controller('api/seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post()
  async seed() {
    return this.seedService.seedAll();
  }

  @Get()
  async getSeed() {
    return this.seedService.seedAll();
  }
}
