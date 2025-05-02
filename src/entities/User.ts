import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';

import { PasswordReset } from './PasswordReset';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true, length: 255 })
    email: string;

    @Column()
    password: string;

    @Column({ name: 'full_name', length: 255 })
    fullName: string;

    @Column({ default: false })
    isAdmin: boolean;

    @Column({ nullable: true, length: 255 })
    title?: string;

    @Column({ name: 'phone_number', nullable: true, length: 15 })
    phoneNumber?: string;

    @Column({ nullable: true })
    avatar?: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => PasswordReset, passwordReset => passwordReset.user, { onDelete: 'CASCADE' })
    passwordResets: PasswordReset[];
}
