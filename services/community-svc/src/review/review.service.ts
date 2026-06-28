import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RpcException } from '@nestjs/microservices';

import { Repository } from 'typeorm';

import { Review } from '../entities/review.entity';
import { Tab } from '../entities/tab.entity';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Tab)
    private readonly tabRepository: Repository<Tab>,
  ) {}

  async create(
    tabId: string,
    userId: string,
    dto: { rating: number; content?: string },
  ): Promise<Review> {
    const tab = await this.tabRepository.findOne({ where: { id: tabId } });
    if (!tab) throw new RpcException(new NotFoundException('타브를 찾을 수 없습니다'));

    if (tab.userId === userId) {
      throw new RpcException(new ForbiddenException('자신의 타브에는 리뷰를 작성할 수 없습니다'));
    }

    const existing = await this.reviewRepository.findOne({
      where: { userId, tabId },
    });
    if (existing) {
      throw new RpcException(new ConflictException('이미 이 타브에 리뷰를 작성했습니다'));
    }

    const review = this.reviewRepository.create({
      userId,
      tabId,
      rating: dto.rating,
      content: dto.content,
    });
    return this.reviewRepository.save(review);
  }

  async getByTab(
    tabId: string,
    page = 1,
    limit = 20,
  ): Promise<{ reviews: Review[]; total: number; averageRating: number }> {
    const [reviews, total] = await this.reviewRepository.findAndCount({
      where: { tabId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const avgResult = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .where('review.tabId = :tabId', { tabId })
      .getRawOne<{ avg: string | null }>();

    const averageRating = avgResult?.avg ? parseFloat(avgResult.avg) : 0;

    return {
      reviews,
      total,
      averageRating: Math.round(averageRating * 10) / 10,
    };
  }

  async update(
    reviewId: string,
    userId: string,
    dto: { rating?: number; content?: string },
  ): Promise<Review> {
    const review = await this.reviewRepository.findOne({ where: { id: reviewId } });
    if (!review) throw new RpcException(new NotFoundException('리뷰를 찾을 수 없습니다'));
    if (review.userId !== userId)
      throw new RpcException(new ForbiddenException('이 리뷰를 수정할 권한이 없습니다'));

    if (dto.rating !== undefined) review.rating = dto.rating;
    if (dto.content !== undefined) review.content = dto.content;

    return this.reviewRepository.save(review);
  }

  async remove(reviewId: string, userId: string): Promise<{ success: true }> {
    const review = await this.reviewRepository.findOne({ where: { id: reviewId } });
    if (!review) throw new RpcException(new NotFoundException('리뷰를 찾을 수 없습니다'));
    if (review.userId !== userId)
      throw new RpcException(new ForbiddenException('이 리뷰를 삭제할 권한이 없습니다'));
    await this.reviewRepository.remove(review);
    return { success: true };
  }

  async getMyReview(tabId: string, userId: string): Promise<Review | null> {
    return this.reviewRepository.findOne({ where: { tabId, userId } });
  }
}
