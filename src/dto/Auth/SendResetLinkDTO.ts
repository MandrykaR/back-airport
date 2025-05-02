import { IsEmail } from 'class-validator';

export class SendResetLinkDTO {
    @IsEmail()
    email: string;
}
