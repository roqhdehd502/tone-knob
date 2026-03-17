import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JamParticipant } from '../entities/jam-participant.entity';
import { JamRoom } from '../entities/jam-room.entity';
import { JamRoomGateway } from './jam-room.gateway';
import { JamRoomService } from './jam-room.service';

@Module({
  imports: [TypeOrmModule.forFeature([JamRoom, JamParticipant])],
  providers: [JamRoomService, JamRoomGateway],
  exports: [JamRoomService],
})
export class JamRoomModule {}
