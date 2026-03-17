import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Comment } from '../entities/comment.entity';
import { Follow } from '../entities/follow.entity';
import { Like } from '../entities/like.entity';
import { Tab } from '../entities/tab.entity';
import { CommunityService } from './community.service';

const mockTab = {
  id: 'tab-1',
  userId: 'user-1',
  title: 'Test Tab',
  likeCount: 5,
};

const mockComment = {
  id: 'comment-1',
  userId: 'user-1',
  tabId: 'tab-1',
  content: '좋은 타브네요!',
  parentId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockLike = {
  id: 'like-1',
  userId: 'user-1',
  tabId: 'tab-1',
};

const mockFollow = {
  id: 'follow-1',
  followerId: 'user-1',
  followingId: 'user-2',
};

const mockLikeRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  count: jest.fn(),
};

const mockCommentRepo = {
  findOne: jest.fn(),
  find: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
};

const mockFollowRepo = {
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  count: jest.fn(),
};

const mockTabRepo = {
  findOne: jest.fn(),
  save: jest.fn(),
};

describe('CommunityService', () => {
  let service: CommunityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunityService,
        { provide: getRepositoryToken(Like), useValue: mockLikeRepo },
        { provide: getRepositoryToken(Comment), useValue: mockCommentRepo },
        { provide: getRepositoryToken(Follow), useValue: mockFollowRepo },
        { provide: getRepositoryToken(Tab), useValue: mockTabRepo },
      ],
    }).compile();

    service = module.get<CommunityService>(CommunityService);
    jest.clearAllMocks();
  });

  // ─── 좋아요 ───

  describe('toggleLike', () => {
    it('좋아요 추가', async () => {
      mockTabRepo.findOne.mockResolvedValue({ ...mockTab });
      mockLikeRepo.findOne.mockResolvedValue(null);
      mockLikeRepo.create.mockReturnValue(mockLike);
      mockLikeRepo.save.mockResolvedValue(mockLike);
      mockTabRepo.save.mockResolvedValue({ ...mockTab, likeCount: 6 });

      const result = await service.toggleLike('tab-1', 'user-1');
      expect(result.liked).toBe(true);
      expect(result.likeCount).toBe(6);
    });

    it('좋아요 취소', async () => {
      mockTabRepo.findOne.mockResolvedValue({ ...mockTab });
      mockLikeRepo.findOne.mockResolvedValue(mockLike);
      mockLikeRepo.remove.mockResolvedValue(mockLike);
      mockTabRepo.save.mockResolvedValue({ ...mockTab, likeCount: 4 });

      const result = await service.toggleLike('tab-1', 'user-1');
      expect(result.liked).toBe(false);
      expect(result.likeCount).toBe(4);
    });

    it('존재하지 않는 타브', async () => {
      mockTabRepo.findOne.mockResolvedValue(null);
      await expect(service.toggleLike('invalid', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('isLiked', () => {
    it('좋아요 상태 확인', async () => {
      mockLikeRepo.count.mockResolvedValue(1);
      expect(await service.isLiked('tab-1', 'user-1')).toBe(true);

      mockLikeRepo.count.mockResolvedValue(0);
      expect(await service.isLiked('tab-1', 'user-2')).toBe(false);
    });
  });

  // ─── 댓글 ───

  describe('createComment', () => {
    it('댓글 생성', async () => {
      mockTabRepo.findOne.mockResolvedValue(mockTab);
      mockCommentRepo.create.mockReturnValue(mockComment);
      mockCommentRepo.save.mockResolvedValue(mockComment);

      const result = await service.createComment('tab-1', 'user-1', {
        content: '좋은 타브네요!',
      });
      expect(result.content).toBe('좋은 타브네요!');
    });

    it('존재하지 않는 타브에 댓글', async () => {
      mockTabRepo.findOne.mockResolvedValue(null);
      await expect(
        service.createComment('invalid', 'user-1', { content: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('존재하지 않는 부모 댓글에 대댓글', async () => {
      mockTabRepo.findOne.mockResolvedValue(mockTab);
      mockCommentRepo.findOne.mockResolvedValue(null);

      await expect(
        service.createComment('tab-1', 'user-1', {
          content: 'reply',
          parentId: 'invalid-parent',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateComment', () => {
    it('본인 댓글 수정', async () => {
      const updated = { ...mockComment, content: '수정됨' };
      mockCommentRepo.findOne.mockResolvedValue({ ...mockComment });
      mockCommentRepo.save.mockResolvedValue(updated);

      const result = await service.updateComment('comment-1', 'user-1', {
        content: '수정됨',
      });
      expect(result.content).toBe('수정됨');
    });

    it('타인 댓글 수정 불가', async () => {
      mockCommentRepo.findOne.mockResolvedValue(mockComment);
      await expect(
        service.updateComment('comment-1', 'user-2', { content: '해킹' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('존재하지 않는 댓글', async () => {
      mockCommentRepo.findOne.mockResolvedValue(null);
      await expect(
        service.updateComment('invalid', 'user-1', { content: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteComment', () => {
    it('본인 댓글 삭제', async () => {
      mockCommentRepo.findOne.mockResolvedValue(mockComment);
      mockCommentRepo.remove.mockResolvedValue(mockComment);

      await expect(
        service.deleteComment('comment-1', 'user-1'),
      ).resolves.toBeUndefined();
    });

    it('타인 댓글 삭제 불가', async () => {
      mockCommentRepo.findOne.mockResolvedValue(mockComment);
      await expect(
        service.deleteComment('comment-1', 'user-2'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── 팔로우 ───

  describe('toggleFollow', () => {
    it('팔로우 추가', async () => {
      mockFollowRepo.findOne.mockResolvedValue(null);
      mockFollowRepo.create.mockReturnValue(mockFollow);
      mockFollowRepo.save.mockResolvedValue(mockFollow);

      const result = await service.toggleFollow('user-1', 'user-2');
      expect(result.following).toBe(true);
    });

    it('팔로우 취소', async () => {
      mockFollowRepo.findOne.mockResolvedValue(mockFollow);
      mockFollowRepo.remove.mockResolvedValue(mockFollow);

      const result = await service.toggleFollow('user-1', 'user-2');
      expect(result.following).toBe(false);
    });

    it('자기 자신 팔로우 불가', async () => {
      await expect(service.toggleFollow('user-1', 'user-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('isFollowing', () => {
    it('팔로우 상태 확인', async () => {
      mockFollowRepo.count.mockResolvedValue(1);
      expect(await service.isFollowing('user-1', 'user-2')).toBe(true);

      mockFollowRepo.count.mockResolvedValue(0);
      expect(await service.isFollowing('user-1', 'user-3')).toBe(false);
    });
  });

  describe('getFollowerCount / getFollowingCount', () => {
    it('팔로워 수 조회', async () => {
      mockFollowRepo.count.mockResolvedValue(10);
      expect(await service.getFollowerCount('user-1')).toBe(10);
    });

    it('팔로잉 수 조회', async () => {
      mockFollowRepo.count.mockResolvedValue(5);
      expect(await service.getFollowingCount('user-1')).toBe(5);
    });
  });
});
