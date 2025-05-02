  import { Router } from 'express';

  import { AuthController } from '../controllers';
  import { validateRequest } from '../middlewares';
  import { LoginDTO, RecoverPasswordDTO, SendResetLinkDTO } from '../dto';

  const authRouter = Router();

  authRouter.post('/login', validateRequest(LoginDTO), AuthController.login);
  authRouter.post('/ping', AuthController.ping);
  authRouter.post('/send_reset_link', validateRequest(SendResetLinkDTO), AuthController.sendResetLink);
  authRouter.post('/recover_password', validateRequest(RecoverPasswordDTO), AuthController.recoverPassword);

  export { authRouter };
