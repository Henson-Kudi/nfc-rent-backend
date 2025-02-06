import requestHandler from '@/common/request/adapter';
import { Router } from 'express';
import RegisterUserController from '../http/controller/register.controller';
import authenticateRequest from '@/common/middleware/authenticate-request';
import GetAccountController from '../http/controller/get-account.controller';

const accountRouter = Router();

accountRouter.use(authenticateRequest());

accountRouter
  .route('/')
  .get(requestHandler(new GetAccountController()))
  .put(requestHandler(new RegisterUserController()))
  .delete(requestHandler(new RegisterUserController()));

export default accountRouter;
