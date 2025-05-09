import { Request, Response } from 'express'
import path from 'path'
import multer from 'multer'
import fs from 'fs'

import { Post } from '../entities'
import { AppDataSource } from '../data-source'
import { ApiResponse } from '../interfaces'
import { CreateUpdatePostDTO } from '../dto'

const uploadDir = path.join(__dirname, '..', '..', 'uploads', 'posts')

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
	limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
	fileFilter: (req, file, cb) => {
		const allowedExtensions = /png|jpg|jpeg|gif/
		const ext = path.extname(file.originalname).toLowerCase()
		if (!allowedExtensions.test(ext)) {
			return cb(new Error('Only images are allowed (png, jpg, jpeg, gif)'))
		}
		cb(null, true)
	},
}).single('upload')

export class PostController {
	static async getPosts(
		req: Request<{}, {}, {}, { page?: string; limit?: string; title?: string }>,
		res: Response<
			ApiResponse<{
				posts: Post[]
				total: number
				page: number
				limit: number
				totalPages: number
			}>
		>
	) {
		try {
			const page = parseInt(req.query.page as string) || 1
			const limit = parseInt(req.query.limit as string) || 10
			const title = req.query.title?.trim()

			if (page < 1 || limit < 1) {
				res.status(400).json({
					success: false,
					faultCode: 400,
					faultString: 'Page and limit must be greater than 0',
				})
				return
			}

			const postRepository = AppDataSource.getRepository(Post)
			const query = postRepository
				.createQueryBuilder('post')
				.skip((page - 1) * limit)
				.take(limit)

			if (title) {
				query.andWhere('post.title LIKE :title', { title: `%${title}%` })
			}

			const [posts, total] = await query.getManyAndCount()

			res.json({
				success: true,
				data: {
					posts,
					total,
					page,
					limit,
					totalPages: Math.ceil(total / limit),
				},
			})
		} catch (error) {
			res.status(500).json({
				success: false,
				faultCode: 500,
				faultString: 'Internal server error',
			})
		}
	}

	static async getPostById(req: Request, res: Response<ApiResponse<Post>>) {
		try {
			const postId = req.params.id

			if (!postId) {
				res.status(400).json({
					success: false,
					faultCode: 400,
					faultString: 'Post ID is required',
				})
				return
			}

			const post = await AppDataSource.getRepository(Post).findOneBy({
				id: postId,
			})

			if (!post) {
				res.status(404).json({
					success: false,
					faultCode: 404,
					faultString: 'Post not found',
				})
				return
			}

			res.json({
				success: true,
				data: post,
			})
		} catch (error) {
			res.status(500).json({
				success: false,
				faultCode: 500,
				faultString: 'Internal server error',
			})
		}
	}

	static async createPost(
		req: Request<{}, {}, CreateUpdatePostDTO>,
		res: Response<ApiResponse<Post>>
	) {
		try {
			const post = await AppDataSource.getRepository(Post).save(req.body)

			res.json({
				success: true,
				data: post,
			})
		} catch (error) {
			res.status(500).json({
				success: false,
				faultCode: 500,
				faultString: 'Internal server error',
			})
		}
	}

	static async updatePost(
		req: Request<{ id: string }, {}, CreateUpdatePostDTO>,
		res: Response<ApiResponse<Post>>
	) {
		try {
			const postRepository = AppDataSource.getRepository(Post)
			await postRepository.update(req.params.id, req.body)

			const updatedPost = await postRepository.findOne({
				where: { id: req.params.id },
			})

			if (!updatedPost) {
				res.status(404).json({
					success: false,
					faultCode: 404,
					faultString: 'Post not found',
				})
				return
			}

			res.json({
				success: true,
				data: updatedPost,
			})
		} catch (error) {
			res.status(500).json({
				success: false,
				faultCode: 500,
				faultString: 'Internal server error',
			})
		}
	}

	static async deletePost(
		req: Request<{ id: string }>,
		res: Response<ApiResponse<{ message: string }>>
	) {
		try {
			const postRepository = AppDataSource.getRepository(Post)
			await postRepository.delete(req.params.id)

			res.json({
				success: true,
				data: { message: 'Post deleted successfully' },
			})
		} catch (error) {
			res.status(500).json({
				success: false,
				faultCode: 500,
				faultString: 'Internal server error',
			})
		}
	}

	static async upload(
		req: Request,
		res: Response<{ url: string } | ApiResponse>
	) {
		try {
			upload(req, res, async err => {
				if (err) {
					return res.status(400).json({
						success: false,
						faultCode: 400,
						faultString: err.message,
					})
				}

				if (req.file?.path) {
					const relativePath = req.file.path.replace(/^\/app/, '')
					res.json({ url: `${process.env.BACKEND_URL}${relativePath}` })
				} else {
					throw new Error('No file uploaded')
				}
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
}
