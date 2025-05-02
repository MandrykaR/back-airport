import { AuthInfo } from './AuthInfo'

export interface GetMyInfoResponse {
	id: string
	email: string
	fullName: string
	title?: string
	phoneNumber?: string
	avatar?: string
	isAdmin: boolean
}

export interface UpdateMyInfoRequest extends AuthInfo {
	fullName?: string
	title?: string
	phoneNumber?: string
	avatar?: string
}

export interface ChangePasswordRequest extends AuthInfo {
	oldPassword: string
	password: string
	confirmPassword: string
}
