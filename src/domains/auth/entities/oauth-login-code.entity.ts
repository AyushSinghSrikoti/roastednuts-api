import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  Index,
  PrimaryColumn,
} from 'typeorm';

import type { GoogleProfile } from '@/domains/auth/types';

@Entity({ name: 'oauth_login_codes' })
export class OAuthLoginCode {
  @PrimaryColumn('uuid')
  @Generated('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  codeHash: string;

  @Column({ type: 'jsonb' })
  profile: GoogleProfile;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  consumedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
