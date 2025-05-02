import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { Repository } from 'typeorm';

import { PasswordReset, User } from '../entities';
import { AppDataSource } from '../data-source';
import { ApiResponse, LoginRequest, LoginResponse, PingResponse } from '../interfaces';

const JWT_SECRET = process.env.JWT_SECRET || 'h3fyjk3IJBOIlyB4yHxzCK';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

export class AuthController {
    static async login(req: Request<{}, {}, LoginRequest>, res: Response<ApiResponse<LoginResponse>>): Promise<void> {
        try {
            const { email, password } = req.body;

            const userRepository = AppDataSource.getRepository(User);
            const user = await userRepository.findOneBy({ email });

            if (!user) {
                res.status(400).json({
                    success: false,
                    faultCode: 400,
                    faultString: 'Invalid email or password'
                });
                return;
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                res.status(400).json({
                    success: false,
                    faultCode: 400,
                    faultString: 'Invalid email or password'
                });
                return;
            }

            const token = jwt.sign({ id: user.id, email: user.email, isAdmin: user.isAdmin }, JWT_SECRET, {
                expiresIn: JWT_EXPIRES_IN
            });

            res.status(200).json({
                success: true,
                data: {
                    message: 'Login successful',
                    token
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                faultString: 'Internal server error',
                faultCode: 500
            });
        }
    }

    static async ping(req: Request, res: Response<ApiResponse<PingResponse>>): Promise<void> {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                res.status(401).json({
                    success: false,
                    faultCode: 401,
                    faultString: 'Token is missing'
                });
                return;
            }

            const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string };

            const newToken = jwt.sign({ id: decoded.id, email: decoded.email }, JWT_SECRET, {
                expiresIn: JWT_EXPIRES_IN
            });

            res.status(200).json({
                success: true,
                data: {
                    token: newToken
                }
            });
        } catch (error: any) {
            if (error.name === 'TokenExpiredError') {
                res.status(401).json({
                    success: false,
                    faultCode: 401,
                    faultString: 'Token has expired'
                });
                return;
            }

            console.error(error);
            res.status(403).json({
                success: false,
                faultCode: 403,
                faultString: 'Token is invalid'
            });
        }
    }

    static async sendResetLink(
        req: Request<{}, {}, { email: string }>,
        res: Response<ApiResponse<{ message: string }>>
    ): Promise<void> {
        try {
            const { email } = req.body;

            const userRepository: Repository<User> = AppDataSource.getRepository(User);
            const user = await userRepository.findOneBy({ email });

            if (!user) {
                res.status(404).json({
                    success: false,
                    faultCode: 404,
                    faultString: 'User with this email does not exist'
                });
                return;
            }

            const resetKey = crypto.randomBytes(32).toString('hex');

            const passwordResetRepository: Repository<PasswordReset> = AppDataSource.getRepository(PasswordReset);
            await passwordResetRepository.save({ user, resetKey: resetKey });

            const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password?key=${resetKey}`;

            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: true,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASSWORD
                }
            });

            const mailOptions = {
                from: process.env.SMTP_SENDER,
                to: email,
                subject: 'Password Reset',
                text: `Please use the following link to reset your password: ${resetLink}`,
                html: `<p>Please use the following link to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`
            };

            await transporter.sendMail(mailOptions);

            res.status(200).json({
                success: true,
                data: { message: 'Password reset link sent successfully' }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                faultCode: 500,
                faultString: 'Internal server error'
            });
        }
    }

    static async recoverPassword(
        req: Request<{}, {}, { key: string; newPassword: string }>,
        res: Response<ApiResponse<{ message: string }>>
    ): Promise<void> {
        try {
            const { key, newPassword } = req.body;

            const passwordResetRepository: Repository<PasswordReset> = AppDataSource.getRepository(PasswordReset);

            const resetRecord = await passwordResetRepository.findOne({
                where: { resetKey: key },
                relations: ['user']
            });

            if (!resetRecord || !((new Date().getTime() - new Date(resetRecord.createdAt).getTime()) / 60000 <= 360)) {
                res.status(400).json({
                    success: false,
                    faultCode: 400,
                    faultString: 'Invalid or expired reset key'
                });
                return;
            }

            const userRepository: Repository<User> = AppDataSource.getRepository(User);
            const user = resetRecord.user;

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword;
            await userRepository.save(user);

            await passwordResetRepository.delete({ user: { id: user.id } });

            res.status(200).json({
                success: true,
                data: { message: 'Password has been successfully changed' }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                faultCode: 500,
                faultString: 'Internal server error'
            });
        }
    }
}
