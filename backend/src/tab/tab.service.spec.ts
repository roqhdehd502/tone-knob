import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Follow } from '../entities/follow.entity';
import { Tab } from '../entities/tab.entity';
import { TabVersion } from '../entities/tab-version.entity';
import { TabService } from './tab.service';

const mockTab = (overrides: Partial<Tab> = {}): Tab =>
  ({
    id: 'tab-1',
    userId: 'user-1',
    title: 'Test Tab',
    artist: 'Artist',
    content: { sections: [] },
    isPublic: false,
    viewCount: 0,
    likeCount: 0,
    downloadCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as Tab;

describe('TabService', () => {
  let service: TabService;
  let tabRepo: Record<string, jest.Mock>;
  let versionRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    tabRepo = {
      create: jest.fn((dto) => ({ ...(dto as Tab) })),
      save: jest.fn((entity) => Promise.resolve({ id: 'tab-1', ...entity })),
      findOne: jest.fn(),
      remove: jest.fn().mockResolvedValue(undefined),
      increment: jest.fn().mockResolvedValue(undefined),
      createQueryBuilder: jest.fn(),
    };

    versionRepo = {
      create: jest.fn((dto) => ({ ...(dto as TabVersion) })),
      save: jest.fn((entity) => Promise.resolve({ id: 'ver-1', ...entity })),
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
    };

    const followRepo = {
      createQueryBuilder: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TabService,
        { provide: getRepositoryToken(Tab), useValue: tabRepo },
        { provide: getRepositoryToken(TabVersion), useValue: versionRepo },
        { provide: getRepositoryToken(Follow), useValue: followRepo },
      ],
    }).compile();

    service = module.get<TabService>(TabService);
  });

  describe('create', () => {
    it('should create a tab and initial version', async () => {
      const dto = {
        title: 'New Tab',
        artist: 'Artist',
        content: { sections: [] },
        isPublic: false,
      };

      const result = await service.create('user-1', dto);

      expect(tabRepo.create).toHaveBeenCalledWith({
        userId: 'user-1',
        title: 'New Tab',
        artist: 'Artist',
        content: { sections: [] },
        isPublic: false,
      });
      expect(tabRepo.save).toHaveBeenCalled();
      expect(versionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          versionNumber: 1,
          changeDescription: '초기 버전',
          createdBy: 'user-1',
        }),
      );
      expect(versionRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('findOne', () => {
    it('should return a tab if found', async () => {
      const tab = mockTab();
      tabRepo.findOne.mockResolvedValue(tab);

      const result = await service.findOne('tab-1');
      expect(result).toEqual(tab);
    });

    it('should throw NotFoundException if not found', async () => {
      tabRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findOneWithAccessCheck', () => {
    it('should return public tab for any user', async () => {
      const tab = mockTab({ isPublic: true });
      tabRepo.findOne.mockResolvedValue(tab);

      const result = await service.findOneWithAccessCheck(
        'tab-1',
        'other-user',
      );
      expect(result).toEqual(tab);
      expect(tabRepo.increment).toHaveBeenCalledWith(
        { id: 'tab-1' },
        'viewCount',
        1,
      );
    });

    it('should return private tab to its owner', async () => {
      const tab = mockTab({ isPublic: false, userId: 'user-1' });
      tabRepo.findOne.mockResolvedValue(tab);

      const result = await service.findOneWithAccessCheck('tab-1', 'user-1');
      expect(result).toEqual(tab);
    });

    it('should throw ForbiddenException for private tab accessed by other user', async () => {
      const tab = mockTab({ isPublic: false, userId: 'user-1' });
      tabRepo.findOne.mockResolvedValue(tab);

      await expect(
        service.findOneWithAccessCheck('tab-1', 'other-user'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update tab fields', async () => {
      const tab = mockTab();
      tabRepo.findOne.mockResolvedValue(tab);
      tabRepo.save.mockResolvedValue({ ...tab, title: 'Updated' });

      const result = await service.update('tab-1', 'user-1', {
        title: 'Updated',
      });
      expect(tabRepo.save).toHaveBeenCalled();
      expect(result.title).toBe('Updated');
    });

    it('should create a new version when content changes', async () => {
      const tab = mockTab();
      tabRepo.findOne.mockResolvedValue(tab);
      versionRepo.findOne.mockResolvedValue({ versionNumber: 1 });
      tabRepo.save.mockResolvedValue(tab);

      await service.update('tab-1', 'user-1', {
        content: { sections: [{ id: '1' }] },
      });

      expect(versionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ versionNumber: 2 }),
      );
      expect(versionRepo.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      const tab = mockTab({ userId: 'user-1' });
      tabRepo.findOne.mockResolvedValue(tab);

      await expect(
        service.update('tab-1', 'other-user', { title: 'Hack' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should remove a tab owned by the user', async () => {
      const tab = mockTab({ userId: 'user-1' });
      tabRepo.findOne.mockResolvedValue(tab);

      await service.remove('tab-1', 'user-1');
      expect(tabRepo.remove).toHaveBeenCalledWith(tab);
    });

    it('should throw ForbiddenException if not the owner', async () => {
      const tab = mockTab({ userId: 'user-1' });
      tabRepo.findOne.mockResolvedValue(tab);

      await expect(service.remove('tab-1', 'other-user')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('fork', () => {
    it('should fork a public tab', async () => {
      const original = mockTab({ isPublic: true, title: 'Original' });
      tabRepo.findOne.mockResolvedValue(original);

      const result = await service.fork('tab-1', 'user-2');

      expect(tabRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-2',
          title: 'Original (Fork)',
          isPublic: false,
        }),
      );
      expect(result).toBeDefined();
    });

    it('should throw ForbiddenException when forking private tab of another user', async () => {
      const original = mockTab({
        isPublic: false,
        userId: 'user-1',
      });
      tabRepo.findOne.mockResolvedValue(original);

      await expect(service.fork('tab-1', 'user-2')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('togglePublish', () => {
    it('should toggle isPublic', async () => {
      const tab = mockTab({ isPublic: false });
      tabRepo.findOne.mockResolvedValue(tab);
      tabRepo.save.mockResolvedValue({ ...tab, isPublic: true });

      const result = await service.togglePublish('tab-1', 'user-1');
      expect(result.isPublic).toBe(true);
    });

    it('should throw ForbiddenException if not the owner', async () => {
      const tab = mockTab({ userId: 'user-1' });
      tabRepo.findOne.mockResolvedValue(tab);

      await expect(
        service.togglePublish('tab-1', 'other-user'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
