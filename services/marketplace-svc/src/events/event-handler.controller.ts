import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

import {
  TAB_EVENTS,
  JAM_EVENTS,
  AUTH_EVENTS,
  TabCreatedEvent,
  JamParticipantJoinedEvent,
  UserLoggedInEvent,
} from '@tone-knob/shared';

import { KnobService } from '../knob/knob.service';

@Controller()
export class EventHandlerController {
  private readonly logger = new Logger(EventHandlerController.name);

  constructor(private readonly knobService: KnobService) {}

  @EventPattern(TAB_EVENTS.CREATED)
  async handleTabCreated(@Payload() data: TabCreatedEvent) {
    this.logger.log(`Tab created: ${data.tabId} by user ${data.userId}`);
    await this.knobService.earnFromTabCreated(data.userId, data.tabId);
  }

  @EventPattern(JAM_EVENTS.PARTICIPANT_JOINED)
  async handleJamParticipantJoined(@Payload() data: JamParticipantJoinedEvent) {
    this.logger.log(`Jam participant joined: ${data.userId} → ${data.roomId}`);
    await this.knobService.earnFromJamParticipation(data.userId, data.roomId);
  }

  @EventPattern(AUTH_EVENTS.USER_LOGGED_IN)
  async handleUserLoggedIn(@Payload() data: UserLoggedInEvent) {
    this.logger.log(`User logged in: ${data.userId}`);
    await this.knobService.earnDailyLogin(data.userId);
  }
}
