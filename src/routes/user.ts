import { Router } from 'express'

import { UserController } from '../controllers'
import { privateRoute, validateRequest } from '../middlewares'
import { UpdateUserInfoDTO, ChangeProfileDTO, RegisterDTO } from '../dto'

const userRouter = Router()

userRouter.get('/user', privateRoute, UserController.getMyInfo)
userRouter.get('/users', privateRoute, UserController.getAllUsers)
userRouter.patch(
	'/user',
	[privateRoute, validateRequest(UpdateUserInfoDTO)],
	UserController.updateMyInfo
)
userRouter.delete('/user', privateRoute, UserController.deleteMyAccount)
userRouter.delete('/users/:id', privateRoute, UserController.deleteUser)
userRouter.patch(
	'/users/update',
	[privateRoute, validateRequest(UpdateUserInfoDTO)],
	UserController.updateUser
)
userRouter.post(
	'/user/create',
	[privateRoute, validateRequest(RegisterDTO)],
	UserController.createUser
)

userRouter.patch(
	'/user/change-profile',
	[privateRoute, validateRequest(ChangeProfileDTO)],
	UserController.updateProfile
)

export { userRouter }
