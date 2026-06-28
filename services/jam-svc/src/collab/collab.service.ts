import { Injectable } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { CollabOperation, OperationType } from "../entities/collab-operation.entity";
import { CollabSession } from "../entities/collab-session.entity";

export interface ApplyOperationResult {
  accepted: boolean;
  serverRevision: number;
  transformedPayload?: Record<string, unknown>;
}

@Injectable()
export class CollabService {
  constructor(
    @InjectRepository(CollabSession)
    private readonly sessionRepository: Repository<CollabSession>,
    @InjectRepository(CollabOperation)
    private readonly operationRepository: Repository<CollabOperation>,
  ) {}

  async getOrCreateSession(tabId: string): Promise<CollabSession> {
    let session = await this.sessionRepository.findOne({ where: { tabId } });
    if (!session) {
      session = this.sessionRepository.create({ tabId, revision: 0 });
      session = await this.sessionRepository.save(session);
    }
    return session;
  }

  async getSession(tabId: string): Promise<CollabSession> {
    const session = await this.sessionRepository.findOne({ where: { tabId } });
    if (!session) {
      throw new RpcException({ statusCode: 404, message: "협업 세션을 찾을 수 없습니다" });
    }
    return session;
  }

  async applyOperation(
    tabId: string,
    userId: string,
    clientRevision: number,
    type: OperationType,
    payload: Record<string, unknown>,
  ): Promise<ApplyOperationResult> {
    const session = await this.getOrCreateSession(tabId);

    if (clientRevision < session.revision) {
      const missedOps = await this.operationRepository.find({
        where: { sessionId: session.id },
        order: { revision: "ASC" },
      });
      const filtered = missedOps.filter((op) => op.revision > clientRevision);

      const transformedPayload = this.transformPayload(
        payload,
        filtered.map((op) => op.payload),
      );

      const op = this.operationRepository.create({
        sessionId: session.id,
        userId,
        revision: session.revision + 1,
        type,
        payload: transformedPayload,
      });
      await this.operationRepository.save(op);

      session.revision += 1;
      await this.sessionRepository.save(session);

      return { accepted: true, serverRevision: session.revision, transformedPayload };
    }

    const op = this.operationRepository.create({
      sessionId: session.id,
      userId,
      revision: session.revision + 1,
      type,
      payload,
    });
    await this.operationRepository.save(op);

    session.revision += 1;
    await this.sessionRepository.save(session);

    return { accepted: true, serverRevision: session.revision };
  }

  async getOperationsSince(tabId: string, sinceRevision: number): Promise<CollabOperation[]> {
    const session = await this.getOrCreateSession(tabId);
    return this.operationRepository
      .find({ where: { sessionId: session.id }, order: { revision: "ASC" } })
      .then((ops) => ops.filter((op) => op.revision > sinceRevision));
  }

  async joinSession(tabId: string, userId: string): Promise<CollabSession> {
    const session = await this.getOrCreateSession(tabId);
    const current = session.activeUserIds || [];
    if (!current.includes(userId)) {
      session.activeUserIds = [...current, userId];
      await this.sessionRepository.save(session);
    }
    return session;
  }

  async leaveSession(tabId: string, userId: string): Promise<void> {
    const session = await this.sessionRepository.findOne({ where: { tabId } });
    if (!session) return;
    session.activeUserIds = (session.activeUserIds || []).filter((id) => id !== userId);
    await this.sessionRepository.save(session);
  }

  async saveSnapshot(tabId: string, snapshot: Record<string, unknown>): Promise<void> {
    const session = await this.getOrCreateSession(tabId);
    session.snapshot = snapshot;
    await this.sessionRepository.save(session);
  }

  private transformPayload(
    payload: Record<string, unknown>,
    concurrentOps: Record<string, unknown>[],
  ): Record<string, unknown> {
    if (concurrentOps.length === 0) return payload;

    let offset = payload.offset as number | undefined;
    if (offset === undefined) return payload;

    for (const op of concurrentOps) {
      const opOffset = op.offset as number | undefined;
      const opLength = op.length as number | undefined;
      const opType = op.opType as string | undefined;

      if (opOffset === undefined) continue;

      if (opType === "insert" && opOffset <= offset) {
        const insertLen = (op.text as string | undefined)?.length ?? 0;
        offset += insertLen;
      } else if (opType === "delete" && opOffset < offset) {
        const delLen = opLength ?? 0;
        offset = Math.max(opOffset, offset - delLen);
      }
    }

    return { ...payload, offset };
  }
}
