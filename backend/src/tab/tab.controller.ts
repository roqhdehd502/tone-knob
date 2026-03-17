import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';

import { CreateTabDto } from './dto/create-tab.dto';
import { UpdateTabDto } from './dto/update-tab.dto';
import { TabService } from './tab.service';

@ApiTags('tabs')
@Controller('api/tabs')
@UseGuards(ThrottlerGuard)
export class TabController {
  constructor(private readonly tabService: TabService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '타브 생성' })
  create(@Request() req: { user: { id: string } }, @Body() dto: CreateTabDto) {
    return this.tabService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: '공개 타브 목록 조회' })
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
  @ApiOperation({ summary: '내 타브 목록 조회' })
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

  @Get('feed')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '팔로우 기반 피드 조회' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getFeed(
    @Request() req: { user: { id: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.tabService.getFeed(
      req.user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '타브 상세 조회' })
  findOne(@Param('id') id: string, @Request() req: { user?: { id: string } }) {
    return this.tabService.findOneWithAccessCheck(id, req.user?.id);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '타브 수정' })
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
  @ApiOperation({ summary: '타브 삭제' })
  remove(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.tabService.remove(id, req.user.id);
  }

  @Post(':id/fork')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '타브 포크' })
  fork(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.tabService.fork(id, req.user.id);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: '타브 버전 히스토리 조회' })
  getVersions(
    @Param('id') id: string,
    @Request() req: { user?: { id: string } },
  ) {
    return this.tabService.getVersions(id, req.user?.id);
  }

  @Post(':id/publish')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '타브 공개/비공개 토글' })
  togglePublish(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.tabService.togglePublish(id, req.user.id);
  }
}
