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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { SettlementStatus } from '../entities/settlement.entity';
import { SubscriptionStatus } from '../entities/subscription.entity';
import { AdminService } from './admin.service';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateSettlementStatusDto } from './dto/update-settlement-status.dto';

@ApiTags('admin')
@Controller('api/admin')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // === 대시보드 ===

  @Get('dashboard')
  @ApiOperation({ summary: '관리자 대시보드 통계' })
  @ApiResponse({ status: 200, description: '대시보드 통계 반환' })
  @ApiResponse({ status: 403, description: '관리자 권한 필요' })
  getDashboardStats(@Request() req: { user: { role?: string } }) {
    return this.adminService.getDashboardStats(req.user);
  }

  // === 사용자 관리 ===

  @Get('users')
  @ApiOperation({ summary: '사용자 목록' })
  @ApiResponse({ status: 200, description: '사용자 목록 반환' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: '페이지 번호',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '페이지당 항목 수',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: '검색어 (이메일/유저네임)',
  })
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
  @ApiResponse({ status: 200, description: '사용자 상세 반환' })
  @ApiResponse({ status: 404, description: '사용자 없음' })
  getUserDetail(
    @Request() req: { user: { role?: string } },
    @Param('id') id: string,
  ) {
    return this.adminService.getUserDetail(req.user, id);
  }

  @Put('users/:id/role')
  @ApiOperation({ summary: '사용자 역할 변경' })
  @ApiResponse({ status: 200, description: '역할 변경 성공' })
  @ApiResponse({ status: 403, description: '관리자 권한 필요' })
  updateUserRole(
    @Request() req: { user: { role?: string } },
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.adminService.updateUserRole(req.user, id, dto.role);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: '사용자 삭제' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @ApiResponse({ status: 403, description: '관리자 권한 필요' })
  deleteUser(
    @Request() req: { user: { role?: string } },
    @Param('id') id: string,
  ) {
    return this.adminService.deleteUser(req.user, id);
  }

  // === 정산 관리 ===

  @Get('settlements')
  @ApiOperation({ summary: '정산 목록' })
  @ApiResponse({ status: 200, description: '정산 목록 반환' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: '페이지 번호',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '페이지당 항목 수',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: SettlementStatus,
    description: '정산 상태 필터',
  })
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
  @ApiResponse({ status: 200, description: '정산 상태 변경 성공' })
  @ApiResponse({ status: 403, description: '관리자 권한 필요' })
  updateSettlementStatus(
    @Request() req: { user: { role?: string } },
    @Param('id') id: string,
    @Body() dto: UpdateSettlementStatusDto,
  ) {
    return this.adminService.updateSettlementStatus(
      req.user,
      id,
      dto.status,
      dto.externalTransferId,
    );
  }

  // === 구독 관리 ===

  @Get('subscriptions')
  @ApiOperation({ summary: '구독 목록' })
  @ApiResponse({ status: 200, description: '구독 목록 반환' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: '페이지 번호',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '페이지당 항목 수',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: SubscriptionStatus,
    description: '구독 상태 필터',
  })
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
