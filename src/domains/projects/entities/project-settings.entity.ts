import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Project } from '@/domains/projects/entities/project.entity';

@Entity({ name: 'project_settings' })
export class ProjectSettings {
  @PrimaryColumn('uuid')
  projectId: string;

  @OneToOne(() => Project, (project) => project.settings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ type: 'integer' })
  maximumStorageGb: number;

  @Column({ type: 'integer' })
  retentionDays: number;

  @Column({ type: 'boolean' })
  archiveExpiredLogs: boolean;

  @Column({ type: 'boolean' })
  warnNearStorageLimit: boolean;

  @Column({ type: 'integer' })
  eventsPerMinute: number;

  @Column({ type: 'integer' })
  errorEventsPerMinute: number;

  @Column({ type: 'integer' })
  maximumEventSizeKb: number;

  @Column({ type: 'integer' })
  eventsPerBatch: number;

  @Column({ type: 'boolean' })
  redactAuthorization: boolean;

  @Column({ type: 'boolean' })
  redactCookies: boolean;

  @Column({ type: 'boolean' })
  redactIpAddresses: boolean;

  @Column({ type: 'boolean' })
  storeStackTraces: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
