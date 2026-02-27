import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';
import { TabService } from './tab.service';
import { CreateTabDto } from './dto/create-tab.dto';
import { UpdateTabDto } from './dto/update-tab.dto';

@ApiTags('tabs')
@Controller('api/tabs')
export class TabController {
  constructor(private readonly tabService: TabService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  create(@Request() req: { user: { id: string } }, @Body() dto: CreateTabDto) {
    return this.tabService.create(req.user.id, dto);
  }

  @Get()
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'userId', required: false })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('userId') userId?: string,
  ) {
    return this.tabService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      userId,
      isPublic: true,
    });
  }

  @Get('my')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  findMyTabs(
    @Request() req: { user: { id: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.tabService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      userId: req.user.id,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: { user?: { id: string } }) {
    return this.tabService.findOneWithAccessCheck(id, req.user?.id);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  update(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body()
    dto: UpdateTabDto,
  ) {
    return this.tabService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  remove(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.tabService.remove(id, req.user.id);
  }

  @Post(':id/fork')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  fork(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.tabService.fork(id, req.user.id);
  }

  @Get(':id/versions')
  getVersions(
    @Param('id') id: string,
    @Request() req: { user?: { id: string } },
  ) {
    return this.tabService.getVersions(id, req.user?.id);
  }

  @Post(':id/publish')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  togglePublish(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.tabService.togglePublish(id, req.user.id);
  }
}
