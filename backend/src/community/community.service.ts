import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Comment } from '../entities/comment.entity';
import { Follow } from '../entities/follow.entity';
import { Like } from '../entities/like.entity';
import { Tab } from '../entities/tab.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommunityService {
  constructor(
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,
    @InjectRepository(Tab)
    private readonly tabRepository: Repository<Tab>,
  ) {}

  // ─── 좋아요 ───

  async toggleLike(
    tabId: string,
    userId: string,
  ): Promise<{ liked: boolean; likeCount: number }> {
    const tab = await this.tabRepository.findOne({ where: { id: tabId } });
    if (!tab) throw new NotFoundException('타브를 찾을 수 없습니다.');

    const existing = await this.likeRepository.findOne({
      where: { tabId, userId },
    });

    if (existing) {
      await this.likeRepository.remove(existing);
      tab.likeCount = Math.max(0, tab.likeCount - 1);
      await this.tabRepository.save(tab);
      return { liked: false, likeCount: tab.likeCount };
    }

    const like = this.likeRepository.create({ tabId, userId });
    await this.likeRepository.save(like);
    tab.likeCount += 1;
    await this.tabRepository.save(tab);
    return { liked: true, likeCount: tab.likeCount };
  }

  async isLiked(tabId: string, userId: string): Promise<boolean> {
    const count = await this.likeRepository.count({
      where: { tabId, userId },
    });
    return count > 0;
  }

  // ─── 댓글 ───

  async createComment(
    tabId: string,
    userId: string,
    dto: CreateCommentDto,
  ): Promise<Comment> {
    const tab = await this.tabRepository.findOne({ where: { id: tabId } });
    if (!tab) throw new NotFoundException('타브를 찾을 수 없습니다.');

    if (dto.parentId) {
      const parent = await this.commentRepository.findOne({
        where: { id: dto.parentId, tabId },
      });
      if (!parent) throw new NotFoundException('부모 댓글을 찾을 수 없습니다.');
    }

    const comment = this.commentRepository.create({
      tabId,
      userId,
      content: dto.content,
      parentId: dto.parentId ?? null,
    });
    return this.commentRepository.save(comment);
  }

  async getComments(
    tabId: string,
    page = 1,
    limit = 20,
  ): Promise<{ comments: Comment[]; total: number }> {
    const [comments, total] = await this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .where('comment.tabId = :tabId', { tabId })
      .andWhere('comment.parentId IS NULL')
      .orderBy('comment.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { comments, total };
  }

  async getReplies(commentId: string): Promise<Comment[]> {
    return this.commentRepository.find({
      where: { parentId: commentId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async updateComment(
    commentId: string,
    userId: string,
    dto: UpdateCommentDto,
  ): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('댓글을 찾을 수 없습니다.');
    if (comment.userId !== userId)
      throw new ForbiddenException('본인의 댓글만 수정할 수 있습니다.');

    comment.content = dto.content;
    return this.commentRepository.save(comment);
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('댓글을 찾을 수 없습니다.');
    if (comment.userId !== userId)
      throw new ForbiddenException('본인의 댓글만 삭제할 수 있습니다.');

    await this.commentRepository.remove(comment);
  }

  // ─── 팔로우 ───

  async toggleFollow(
    followerId: string,
    followingId: string,
  ): Promise<{ following: boolean }> {
    if (followerId === followingId)
      throw new ConflictException('자기 자신을 팔로우할 수 없습니다.');

    const existing = await this.followRepository.findOne({
      where: { followerId, followingId },
    });

    if (existing) {
      await this.followRepository.remove(existing);
      return { following: false };
    }

    const follow = this.followRepository.create({ followerId, followingId });
    await this.followRepository.save(follow);
    return { following: true };
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const count = await this.followRepository.count({
      where: { followerId, followingId },
    });
    return count > 0;
  }

  async getFollowers(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ followers: Follow[]; total: number }> {
    const [followers, total] = await this.followRepository.findAndCount({
      where: { followingId: userId },
      relations: ['follower'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { followers, total };
  }

  async getFollowing(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ following: Follow[]; total: number }> {
    const [following, total] = await this.followRepository.findAndCount({
      where: { followerId: userId },
      relations: ['following'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { following, total };
  }

  async getFollowerCount(userId: string): Promise<number> {
    return this.followRepository.count({ where: { followingId: userId } });
  }

  async getFollowingCount(userId: string): Promise<number> {
    return this.followRepository.count({ where: { followerId: userId } });
  }
}
