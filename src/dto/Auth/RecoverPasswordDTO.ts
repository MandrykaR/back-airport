import { IsString, MinLength, MaxLength } from 'class-validator';

export class RecoverPasswordDTO {
    @IsString()
    key: string;

    @IsString()
    @MinLength(6)
    @MaxLength(255)
    newPassword: string;
}
