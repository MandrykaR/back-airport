import { DataSource } from 'typeorm';
import 'dotenv/config';
import bcrypt from 'bcrypt';

import { PasswordReset, Post, User } from './entities';

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'main',
    synchronize: true,
    logging: false,
    entities: [User, PasswordReset, Post],
    migrations: [],
    subscribers: []
});

export const createDefaultAdmin = async (): Promise<void> => {
    const userRepository = AppDataSource.getRepository(User);
    const defaultUser = await userRepository.findOneBy({ email: 'striknameste@gmail.com' });

    if (!defaultUser) {
        const adminUser = new User();
        adminUser.fullName = 'Root Admin';
        adminUser.email = 'striknameste@gmail.com';
        adminUser.password = await bcrypt.hash('admin_pass', 10);
        adminUser.isAdmin = true;

        await userRepository.save(adminUser);
        console.log('Default admin user created');
    } else {
        console.log('Default admin user already exists');
    }
};
