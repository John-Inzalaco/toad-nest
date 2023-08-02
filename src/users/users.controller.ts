import { Controller, Get } from '@nestjs/common';
import { PDSHasAccess } from '../auth/auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Users')
@Controller('api/v1/users')
export class UsersController {
  /**
   * WIP: Placeholder for auth logic
   */
  @Get(':id')
  @PDSHasAccess()
  async findOne() {
    return { user: null };
  }
}
