import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255, unique: true })
  email: string;

  @Column({ type: "varchar", length: 50, unique: true })
  username: string;

  @Column({ type: "varchar", length: 255, select: false, nullable: true })
  passwordHash: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  displayName: string;

  @Column({ type: "text", nullable: true })
  avatarUrl: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  bio: string;

  @Column({ type: "varchar", length: 20, default: "user" })
  role: string;

  @Column({ type: "varchar", length: 20, default: "free" })
  subscriptionTier: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
