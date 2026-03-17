import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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

import { SettlementStatus } from '../entities/settlement.entity';
import { SubscriptionStatus } from '../entities/subscription.entity';
import { AdminService } from './admin.service';

@ApiTags('admin')
@Controller('api/admin')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // === 대시보드 ===

  @Get('dashboard')
  @ApiOperation({ summary: '관리자 대시보드 통계' })
  getDashboardStats(@Request() req: { user: { role?: string } }) {
    return this.adminService.getDashboardStats(req.user);
  }

  // === 사용자 관리 ===

  @Get('users')
  @ApiOperation({ summary: '사용자 목록' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  listUsers(
    @Request() req: { user: { role?: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.listUsers(
      req.user,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      search,
    );
  }

  @Get('users/:id')
  @ApiOperation({ summary: '사용자 상세 조회' })
  getUserDetail(
    @Request() req: { user: { role?: string } },
    @Param('id') id: string,
  ) {
    return this.adminService.getUserDetail(req.user, id);
  }

  @Put('users/:id/role')
  @ApiOperation({ summary: '사용자 역할 변경' })
  updateUserRole(
    @Request() req: { user: { role?: string } },
    @Param('id') id: string,
    @Body() body: { role: string },
  ) {
    return this.adminService.updateUserRole(req.user, id, body.role);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: '사용자 삭제' })
  deleteUser(
    @Request() req: { user: { role?: string } },
    @Param('id') id: string,
  ) {
    return this.adminService.deleteUser(req.user, id);
  }

  // === 정산 관리 ===

  @Get('settlements')
  @ApiOperation({ summary: '정산 목록' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: SettlementStatus })
  listSettlements(
    @Request() req: { user: { role?: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: SettlementStatus,
  ) {
    return this.adminService.listSettlements(
      req.user,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      status,
    );
  }

  @Put('settlements/:id/status')
  @ApiOperation({ summary: '정산 상태 변경' })
  updateSettlementStatus(
    @Request() req: { user: { role?: string } },
    @Param('id') id: string,
    @Body() body: { status: SettlementStatus; externalTransferId?: string },
  ) {
    return this.adminService.updateSettlementStatus(
      req.user,
      id,
      body.status,
      body.externalTransferId,
    );
  }

  // === 구독 관리 ===

  @Get('subscriptions')
  @ApiOperation({ summary: '구독 목록' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: SubscriptionStatus })
  listSubscriptions(
    @Request() req: { user: { role?: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: SubscriptionStatus,
  ) {
    return this.adminService.listSubscriptions(
      req.user,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      status,
    );
  }
}
