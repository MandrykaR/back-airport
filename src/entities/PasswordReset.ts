import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';

import { User } from './User';

@Entity()
export class PasswordReset {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    resetKey: string;

    @ManyToOne(() => User, user => user.passwordResets, { onDelete: 'CASCADE' })
    user: User;

    @CreateDateColumn()
    createdAt: Date;
}
