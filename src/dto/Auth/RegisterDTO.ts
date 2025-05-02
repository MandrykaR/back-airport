import { IsEmail, IsString, MinLength, MaxLength, IsBoolean } from 'class-validator';

export class RegisterDTO {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(3)
    @MaxLength(255)
    fullName: string;

    @IsString()
    @MinLength(6)
    @MaxLength(255)
    password: string;

    @IsBoolean()
    isAdmin: boolean;
}
