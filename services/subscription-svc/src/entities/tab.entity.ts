import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity("tabs")
export class Tab {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ type: "uuid" })
  userId: string;

  @Column({ type: "varchar", length: 200 })
  title: string;

  @CreateDateColumn()
  createdAt: Date;
}
