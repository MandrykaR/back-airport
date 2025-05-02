import { Router } from 'express';

import { PostController } from '../controllers';
import { privateRoute, validateRequest } from '../middlewares';
import { CreateUpdatePostDTO } from '../dto';

const postRouter = Router();

postRouter.get('/posts', PostController.getPosts);
postRouter.get('/posts/:id', PostController.getPostById);
postRouter.post('/posts', [privateRoute, validateRequest(CreateUpdatePostDTO)], PostController.createPost);
postRouter.put('/posts/:id', [privateRoute, validateRequest(CreateUpdatePostDTO)], PostController.updatePost);
postRouter.delete('/posts/:id', [privateRoute], PostController.deletePost);

export { postRouter };
