import { Injectable } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { User } from "../entities/user.entity";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new RpcException({ statusCode: 404, message: "사용자를 찾을 수 없습니다" });
    }
    return user;
  }

  async update(
    id: string,
    dto: { displayName?: string; avatarUrl?: string; bio?: string },
  ): Promise<User> {
    const user = await this.findById(id);
    Object.assign(user, dto);
    return this.userRepository.save(user);
  }
}
