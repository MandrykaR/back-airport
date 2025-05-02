import { IsString, MinLength, MaxLength, ValidateIf, IsPhoneNumber } from 'class-validator';

export class UpdateUserInfoDTO {
    @ValidateIf((_, value) => value !== undefined)
    @IsString()
    @MinLength(3)
    @MaxLength(255)
    fullName: string;

    @ValidateIf((_, value) => value !== undefined)
    @IsString()
    @MaxLength(255)
    title?: string;

    @ValidateIf((_, value) => value !== undefined)
    @IsPhoneNumber()
    @MaxLength(15)
    phoneNumber?: string;
}
