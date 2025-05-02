import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiResponse } from '../interfaces';

const JWT_SECRET = process.env.JWT_SECRET || 'h3fyjkB4yHxzCK';

export const privateRoute = (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({
            success: false,
            faultCode: 401,
            faultString: 'Token is missing'
        });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
        req.body._user = decoded;

        next();
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            res.status(401).json({
                success: false,
                faultCode: 401,
                faultString: 'Token has expired'
            });
            return;
        }

        res.status(403).json({
            success: false,
            faultCode: 403,
            faultString: 'Token is invalid'
        });
    }
};
