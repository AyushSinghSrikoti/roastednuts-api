import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import {
    AVATAR_URL_MAX_LENGTH,
    DEFAULT_TOTAL_TRANSACTIONS,
    DEFAULT_USER_RATING,
    OAUTH_PROVIDER_ID_MAX_LENGTH,
    PASSWORD_HASH_MAX_LENGTH,
    USERS_TABLE_NAME,
} from '../constants/auth.constants';

import {
    MAX_EMAIL_LENGTH,
    MAX_NAME_LENGTH,
} from 'src/global/constants/validation.constants';
import { AuthProvider } from '../enums';

@Entity(USERS_TABLE_NAME)
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: MAX_EMAIL_LENGTH, unique: true })
    email: string;

    @Column({ type: 'varchar', length: MAX_NAME_LENGTH, nullable: true })
    name: string | null;

    @Column({
        type: 'varchar',
        length: PASSWORD_HASH_MAX_LENGTH,
        nullable: true,
    })
    password: string | null;

    @Column({
        type: 'enum',
        enum: AuthProvider,
        enumName: 'user_auth_provider',
        default: AuthProvider.LOCAL,
    })
    provider: AuthProvider;

    @Column({
        type: 'varchar',
        length: OAUTH_PROVIDER_ID_MAX_LENGTH,
        nullable: true,
    })
    providerId: string | null;

    @Column({ type: 'float', default: DEFAULT_USER_RATING })
    rating: number;

    @Column({ default: DEFAULT_TOTAL_TRANSACTIONS })
    totalTransactions: number;

    @Column({
        type: 'varchar',
        length: AVATAR_URL_MAX_LENGTH,
        nullable: true,
    })
    avatar: string | null;

    @Column({ default: true })
    isActive: boolean;

    @Column({ default: false })
    isVerified: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}