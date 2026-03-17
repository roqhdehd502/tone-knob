import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { PracticeSession } from '../entities/practice-session.entity';

@Injectable()
export class PracticeService {
  constructor(
    @InjectRepository(PracticeSession)
    private readonly sessionRepository: Repository<PracticeSession>,
  ) {}

  async recordSession(
    userId: string,
    data: {
      tabId?: string;
      durationSeconds: number;
      bpm?: number;
      speedMultiplier?: number;
      loopStartMeasure?: number;
      loopEndMeasure?: number;
    },
  ): Promise<PracticeSession> {
    const session = this.sessionRepository.create({
      userId,
      tabId: data.tabId,
      durationSeconds: data.durationSeconds,
      bpm: data.bpm,
      speedMultiplier: data.speedMultiplier,
      loopStartMeasure: data.loopStartMeasure,
      loopEndMeasure: data.loopEndMeasure,
    });
    return this.sessionRepository.save(session);
  }

  async getStats(userId: string): Promise<{
    totalSessions: number;
    totalMinutes: number;
    averageSessionMinutes: number;
    thisWeekMinutes: number;
    thisMonthMinutes: number;
    streak: number;
  }> {
    const totalResult = await this.sessionRepository
      .createQueryBuilder('s')
      .select('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(s.durationSeconds), 0)', 'total')
      .where('s.userId = :userId', { userId })
      .getRawOne<{ count: string; total: string }>();

    const totalSessions = parseInt(totalResult?.count || '0', 10);
    const totalSeconds = parseInt(totalResult?.total || '0', 10);
    const totalMinutes = Math.round(totalSeconds / 60);
    const averageSessionMinutes =
      totalSessions > 0 ? Math.round(totalSeconds / 60 / totalSessions) : 0;

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekResult = await this.sessionRepository
      .createQueryBuilder('s')
      .select('COALESCE(SUM(s.durationSeconds), 0)', 'total')
      .where('s.userId = :userId', { userId })
      .andWhere('s.createdAt >= :weekStart', { weekStart })
      .getRawOne<{ total: string }>();
    const thisWeekMinutes = Math.round(parseInt(weekResult?.total || '0', 10) / 60);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthResult = await this.sessionRepository
      .createQueryBuilder('s')
      .select('COALESCE(SUM(s.durationSeconds), 0)', 'total')
      .where('s.userId = :userId', { userId })
      .andWhere('s.createdAt >= :monthStart', { monthStart })
      .getRawOne<{ total: string }>();
    const thisMonthMinutes = Math.round(parseInt(monthResult?.total || '0', 10) / 60);

    const recentDays = await this.sessionRepository
      .createQueryBuilder('s')
      .select('DISTINCT DATE(s.createdAt)', 'day')
      .where('s.userId = :userId', { userId })
      .orderBy('day', 'DESC')
      .limit(365)
      .getRawMany<{ day: string }>();

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < recentDays.length; i++) {
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      const dayStr = expectedDate.toISOString().split('T')[0];
      const sessionDay = new Date(recentDays[i].day).toISOString().split('T')[0];

      if (sessionDay === dayStr) {
        streak++;
      } else {
        break;
      }
    }

    return { totalSessions, totalMinutes, averageSessionMinutes, thisWeekMinutes, thisMonthMinutes, streak };
  }

  async getRecentSessions(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: PracticeSession[]; total: number }> {
    const [data, total] = await this.sessionRepository.findAndCount({
      where: { userId },
      relations: ['tab'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }
}
