import * as dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';

import { AppDataSource, createDefaultAdmin } from './data-source';
import { authRouter, postRouter, userRouter } from './routes';

dotenv.config({
    path: process.env.NODE_ENV === 'development' ? '.env_local' : '.env'
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        methods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        allowedHeaders: 'Content-Type,Authorization',
        credentials: true
    })
);
app.use(express.json());

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/auth', authRouter);
app.use('', userRouter);
app.use('', postRouter);

app.get('/', (req, res) => {
    res.send('Hello World!');
});

AppDataSource.initialize()
    .then(async () => {
        console.log('Database connected successfully!');
        await createDefaultAdmin();
        app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));
    })
    .catch(err => {
        console.error('Error during Data Source initialization', err);
    });

