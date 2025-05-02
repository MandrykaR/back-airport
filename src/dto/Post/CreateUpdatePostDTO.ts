import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUpdatePostDTO {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    content: string;
}
