import {
	IsEmail,
	IsOptional,
	IsString,
	MaxLength,
	MinLength,
} from 'class-validator'

export class ChangeProfileDTO {
	@IsString()
	@MinLength(6)
	@MaxLength(255)
	oldPassword: string

	@IsOptional()
	@IsString()
	@MinLength(6)
	@MaxLength(255)
	newPassword?: string

	@IsOptional()
	@IsString()
	@MinLength(6)
	@MaxLength(255)
	confirmPassword?: string

	@IsOptional()
	@IsEmail()
	newEmail?: string
}
