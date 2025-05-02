import { Request, Response } from 'express'
import { Repository } from 'typeorm'
import multer from 'multer'
import bcrypt from 'bcrypt'
import path from 'path'
import fs from 'fs'

import { User } from '../entities'
import { AppDataSource } from '../data-source'
import {
	ApiResponse,
	AuthInfo,
	GetMyInfoResponse,
	UpdateMyInfoRequest,
} from '../interfaces'

const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'avatars')

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir, { recursive: true })
		}
		cb(null, uploadDir)
	},
	filename: (req, file, cb) => {
		const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
		cb(null, `${uniqueSuffix}-${file.originalname}`)
	},
})

const upload = multer({
	storage,
	limits: { fileSize: 1 * 1024 * 1024 }, // 1MB
	fileFilter: (req, file, cb) => {
		const allowedExtensions = /png|jpg|jpeg|gif/
		const ext = path.extname(file.originalname).toLowerCase()
		if (!allowedExtensions.test(ext)) {
			return cb(new Error('Only images are allowed (png, jpg, jpeg, gif)'))
		}
		cb(null, true)
	},
}).single('avatar')

export class UserController {
	static async getAllUsers(
		req: Request<{}, {}, AuthInfo, { page?: string; limit?: string }>,
		res: Response<
			ApiResponse<{
				users: User[]
				total: number
				page: number
				limit: number
				totalPages: number
			}>
		>
	): Promise<void> {
		try {
			if (!req.body._user.isAdmin) {
				res.status(403).json({
					success: false,
					faultCode: 403,
					faultString: 'Forbidden',
				})
				return
			}
			const userRepository = AppDataSource.getRepository(User)

			// Get pagination parameters from query string with defaults
			const page = parseInt(req.query.page as string) || 1
			const limit = parseInt(req.query.limit as string) || 10
			const skip = (page - 1) * limit

			// Fetch users with pagination and get total count
			const [users, total] = await userRepository.findAndCount({
				skip: skip,
				take: limit,
				order: {
					id: 'ASC',
				},
			})

			// Calculate total pages
			const totalPages = Math.ceil(total / limit)

			res.status(200).json({
				success: true,
				data: {
					users,
					total,
					page,
					limit,
					totalPages,
				},
			})
		} catch (error: any) {
			console.error('Error fetching users:', error)
			res.status(500).json({
				success: false,
				faultCode: 500,
				faultString: 'Internal server error',
			})
		}
	}

	static async getMyInfo(
		req: Request<{}, {}, AuthInfo>,
		res: Response<ApiResponse<GetMyInfoResponse>>
	): Promise<void> {
		try {
			const userRepository = AppDataSource.getRepository(User)
			const user = await userRepository.findOneOrFail({
				where: { id: req.body._user.id },
			})

			res.status(200).json({
				success: true,
				data: {
					id: user.id,
					email: user.email,
					fullName: user.fullName,
					title: user.title,
					phoneNumber: user.phoneNumber,
					avatar: user.avatar,
					isAdmin: user.isAdmin,
				},
			})
		} catch (error: any) {
			console.error(error)
			res.status(500).json({
				success: false,
				faultCode: 500,
				faultString: 'Internal server error',
			})
		}
	}

	static async updateMyInfo(
		req: Request<{}, {}, UpdateMyInfoRequest>,
		res: Response<ApiResponse>
	): Promise<void> {
		try {
			const userRepository: Repository<User> = AppDataSource.getRepository(User)
			const userId = req.body._user.id

			upload(req, res, async err => {
				if (err) {
					return res.status(400).json({
						success: false,
						faultCode: 400,
						faultString: err.message,
					})
				}

				await userRepository.update(
					{ id: userId },
					{
						fullName: req.body.fullName,
						title: req.body.title,
						phoneNumber: req.body.phoneNumber,
					}
				)

				const user = await userRepository.findOneOrFail({
					where: { id: userId },
				})

				if (req.file) {
					const filePath = req.file.path

					// If user had an avatar, delete it
					if (user.avatar) {
						const oldFilePath = path.join(uploadDir, user.avatar)
						if (fs.existsSync(oldFilePath)) {
							fs.unlinkSync(oldFilePath)
						}
					}

					user.avatar = path.basename(filePath)
					await userRepository.save(user)
				}

				if (req.body.avatar === '') {
					if (user.avatar) {
						const oldFilePath = path.join(uploadDir, user.avatar)
						if (fs.existsSync(oldFilePath)) {
							fs.unlinkSync(oldFilePath)
						}
					}

					user.avatar = ''
					await userRepository.save(user)
				}

				res.status(200).json({
					success: true,
					data: {
						id: user.id,
						email: user.email,
						fullName: user.fullName,
						title: user.title,
						phoneNumber: user.phoneNumber,
						avatar: user.avatar,
					},
				})
			})
		} catch (error: any) {
			console.error(error)

			res.status(500).json({
				success: false,
				faultCode: 500,
				faultString: 'Internal server error',
			})
		}
	}

	static async deleteMyAccount(
		req: Request<{}, {}, AuthInfo>,
		res: Response<ApiResponse<{ message: string }>>
	): Promise<void> {
		try {
			const userRepository = AppDataSource.getRepository(User)
			await userRepository.delete({ id: req.body._user.id })

			res.status(200).json({
				success: true,
				data: { message: 'Account successfully deleted' },
			})
		} catch (error: any) {
			console.error(error)

			res.status(500).json({
				success: false,
				faultCode: 500,
				faultString: 'Internal server error',
			})
		}
	}

	static async updateProfile(
		req: Request<
			{},
			{},
			{
				oldPassword: string
				newPassword?: string
				confirmPassword?: string
				newEmail?: string
				newFullName?: string
			} & AuthInfo
		>,
		res: Response<
			ApiResponse<{ message: string; email?: string; fullName?: string }>
		>
	): Promise<void> {
		try {
			const {
				oldPassword,
				newPassword,
				confirmPassword,
				newEmail,
				newFullName,
				_user,
			} = req.body

			const userRepository = AppDataSource.getRepository(User)
			const user = await userRepository.findOneByOrFail({ id: _user.id })

			const isOldPasswordValid = await bcrypt.compare(
				oldPassword,
				user.password
			)
			if (!isOldPasswordValid) {
				res.status(400).json({
					success: false,
					faultCode: 400,
					faultString: 'Invalid current password',
				})
				return
			}

			if (newEmail && newEmail !== user.email) {
				const isEmailTaken = await userRepository.findOneBy({ email: newEmail })
				if (isEmailTaken) {
					res.status(400).json({
						success: false,
						faultCode: 400,
						faultString: 'This email is already taken',
					})
					return
				}
				user.email = newEmail
			}

			if (newPassword === oldPassword) {
				res.status(400).json({
					success: false,
					faultCode: 400,
					faultString: 'New password cannot be the same as the old password',
				})
				return
			}

			if (newPassword) {
				if (newPassword !== confirmPassword) {
					res.status(400).json({
						success: false,
						faultCode: 400,
						faultString: 'Passwords do not match',
					})
					return
				}
				const hashedPassword = await bcrypt.hash(newPassword, 10)
				user.password = hashedPassword
			}

			if (newFullName && newFullName !== user.fullName) {
				user.fullName = newFullName
			}

			await userRepository.save(user)

			res.status(200).json({
				success: true,
				data: {
					message: 'Profile successfully updated',
					email: user.email,
					fullName: user.fullName,
				},
			})
		} catch (error) {
			console.error(error)
			res.status(500).json({
				success: false,
				faultCode: 500,
				faultString: 'Internal server error',
			})
		}
	}

	static async deleteUser(
		req: Request<{ id: string }, {}, AuthInfo>,
		res: Response<ApiResponse<{ message: string }>>
	): Promise<void> {
		if (!req.body._user.isAdmin) {
			res.status(403).json({
				success: false,
				faultCode: 403,
				faultString: 'Forbidden',
			})
			return
		}

		try {
			const userRepository = AppDataSource.getRepository(User)
			const user = await userRepository.findOneOrFail({
				where: { id: req.params.id },
			})

			await userRepository.delete({ id: user.id })

			res.status(200).json({
				success: true,
				data: { message: 'User successfully deleted' },
			})
		} catch (error: any) {
			console.error(error)

			res.status(500).json({
				success: false,
				faultCode: 500,
				faultString: 'Internal server error',
			})
		}
	}

	static async createUser(
		req: Request<
			{},
			{},
			{
				email: string
				password: string
				fullName: string
				isAdmin: boolean
			} & AuthInfo
		>,
		res: Response<ApiResponse<User>>
	): Promise<void> {
		if (!req.body._user.isAdmin) {
			res.status(403).json({
				success: false,
				faultCode: 403,
				faultString: 'Forbidden',
			})
			return
		}

		try {
			const { email, password, fullName, isAdmin } = req.body

			const userRepository = AppDataSource.getRepository(User)

			const isEmailTaken = await userRepository.findOneBy({ email })

			if (isEmailTaken) {
				res.status(400).json({
					success: false,
					faultCode: 400,
					faultString: 'This email is already taken',
				})
				return
			}

			const user = new User()
			user.email = email
			user.password = await bcrypt.hash(password, 10)
			user.fullName = fullName
			user.isAdmin = isAdmin

			const newUser = await userRepository.save(user)

			res.status(201).json({
				success: true,
				data: newUser,
			})
		} catch (error: any) {
			console.error(error)

			res.status(500).json({
				success: false,
				faultCode: 500,
				faultString: 'Internal server error',
			})
		}
	}

	static async updateUser(
		req: Request<
			{},
			{},
			{ user_id: string; isAdmin: boolean } & UpdateMyInfoRequest
		>,
		res: Response<ApiResponse>
	): Promise<void> {
		if (!req.body._user.isAdmin) {
			res.status(403).json({
				success: false,
				faultCode: 403,
				faultString: 'Forbidden',
			})
			return
		}

		try {
			const userRepository = AppDataSource.getRepository(User)
			const userId = req.body.user_id
			if (!userId) {
				res.status(400).json({
					success: false,
					faultCode: 400,
					faultString: 'User ID is required',
				})
				return
			}
			await userRepository.update(
				{ id: userId },
				{
					fullName: req.body.fullName,
					title: req.body.title,
					phoneNumber: req.body.phoneNumber,
					isAdmin: req.body.isAdmin,
				}
			)
			const user = await userRepository.findOneOrFail({
				where: { id: userId },
			})

			res.status(200).json({
				success: true,
				data: {
					id: user.id,
					email: user.email,
					fullName: user.fullName,
					title: user.title,
					phoneNumber: user.phoneNumber,
					avatar: user.avatar,
					isAdmin: user.isAdmin,
				},
			})
		} catch (error: any) {
			console.error(error)

			res.status(500).json({
				success: false,
				faultCode: 500,
				faultString: 'Internal server error',
			})
		}
	}
}
