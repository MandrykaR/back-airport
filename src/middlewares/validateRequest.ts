import { plainToClass } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Request, Response, NextFunction } from 'express';

export function validateRequest<T extends Object>(dtoClass: new () => T) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const user = req.body._user;

        const dtoObject = plainToClass(dtoClass, req.body);
        const errors = validateSync(dtoObject);

        if (errors.length > 0) {
            res.status(400).json({
                success: false,
                faultString: errors.map(error => Object.values(error.constraints || {}).join(', ')).join(', '),
                faultCode: 400
            });
            return;
        }

        req.body = { ...dtoObject, _user: user };
        next();
    };
}
