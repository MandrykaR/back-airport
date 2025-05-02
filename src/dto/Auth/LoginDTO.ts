import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class LoginDTO {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    @MaxLength(255)
    password: string;
}
