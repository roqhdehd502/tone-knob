import { Controller, Inject } from "@nestjs/common";
import { ClientProxy, MessagePattern, Payload } from "@nestjs/microservices";

import { TAB_EVENTS } from "@tone-knob/shared";

import { PracticeService } from "./practice/practice.service";
import { TabService } from "./tab/tab.service";

@Controller()
export class TabSvcController {
  constructor(
    private readonly tabService: TabService,
    private readonly practiceService: PracticeService,
    @Inject("COMMUNITY_SERVICE") private readonly communityClient: ClientProxy,
    @Inject("MARKETPLACE_SERVICE")
    private readonly marketplaceClient: ClientProxy,
  ) {}

  // ── Tab CRUD ──

  @MessagePattern("tabs.create")
  async create(
    @Payload()
    data: {
      userId: string;
      dto: {
        title: string;
        artist?: string;
        content: Record<string, unknown>;
        isPublic?: boolean;
      };
    },
  ) {
    const tab = await this.tabService.create(data.userId, data.dto);
    const tabCreatedEvent = {
      tabId: tab.id,
      userId: data.userId,
      title: tab.title,
      instrument: tab.artist,
      createdAt: tab.createdAt,
    };
    this.communityClient.emit(TAB_EVENTS.CREATED, tabCreatedEvent);
    this.marketplaceClient.emit(TAB_EVENTS.CREATED, tabCreatedEvent);
    return tab;
  }

  @MessagePattern("tabs.findAll")
  async findAll(
    @Payload()
    data: {
      page?: number;
      limit?: number;
      search?: string;
      userId?: string;
      isPublic?: boolean;
    },
  ) {
    return this.tabService.findAll(data);
  }

  @MessagePattern("tabs.findOne")
  async findOne(@Payload() data: { id: string; requestUserId?: string }) {
    return this.tabService.findOneWithAccessCheck(data.id, data.requestUserId);
  }

  @MessagePattern("tabs.update")
  async update(
    @Payload()
    data: {
      id: string;
      userId: string;
      dto: {
        title?: string;
        artist?: string;
        content?: Record<string, unknown>;
        isPublic?: boolean;
        changeDescription?: string;
      };
    },
  ) {
    const tab = await this.tabService.update(data.id, data.userId, data.dto);
    this.communityClient.emit(TAB_EVENTS.UPDATED, {
      tabId: tab.id,
      userId: data.userId,
      title: tab.title,
      updatedAt: tab.updatedAt,
    });
    return tab;
  }

  @MessagePattern("tabs.remove")
  async remove(@Payload() data: { id: string; userId: string }) {
    const result = await this.tabService.remove(data.id, data.userId);
    this.communityClient.emit(TAB_EVENTS.DELETED, {
      tabId: data.id,
      userId: data.userId,
    });
    return result;
  }

  @MessagePattern("tabs.fork")
  async fork(@Payload() data: { id: string; userId: string }) {
    const forked = await this.tabService.fork(data.id, data.userId);
    this.communityClient.emit(TAB_EVENTS.FORKED, {
      tabId: forked.id,
      originalTabId: data.id,
      userId: data.userId,
      title: forked.title,
    });
    return forked;
  }

  @MessagePattern("tabs.getVersions")
  async getVersions(
    @Payload() data: { tabId: string; requestUserId?: string },
  ) {
    return this.tabService.getVersions(data.tabId, data.requestUserId);
  }

  @MessagePattern("tabs.getFeed")
  async getFeed(
    @Payload() data: { userId: string; page?: number; limit?: number },
  ) {
    return this.tabService.getFeed(data.userId, data.page, data.limit);
  }

  @MessagePattern("tabs.togglePublish")
  async togglePublish(@Payload() data: { id: string; userId: string }) {
    const tab = await this.tabService.togglePublish(data.id, data.userId);
    this.communityClient.emit(TAB_EVENTS.PUBLISHED, {
      tabId: tab.id,
      userId: data.userId,
      title: tab.title,
      isPublished: tab.isPublic,
    });
    return tab;
  }

  // ── Practice ──

  @MessagePattern("practice.record")
  async recordSession(
    @Payload()
    data: {
      userId: string;
      dto: {
        tabId?: string;
        durationSeconds: number;
        bpm?: number;
        speedMultiplier?: number;
        loopStartMeasure?: number;
        loopEndMeasure?: number;
      };
    },
  ) {
    return this.practiceService.recordSession(data.userId, data.dto);
  }

  @MessagePattern("practice.stats")
  async getStats(@Payload() data: { userId: string }) {
    return this.practiceService.getStats(data.userId);
  }

  @MessagePattern("practice.recent")
  async getRecentSessions(
    @Payload() data: { userId: string; page?: number; limit?: number },
  ) {
    return this.practiceService.getRecentSessions(
      data.userId,
      data.page,
      data.limit,
    );
  }
}
