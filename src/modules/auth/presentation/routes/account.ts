import requestHandler from '@/common/request/adapter';
import { Router } from 'express';
import RegisterUserController from '../http/controller/register.controller';
import authenticateRequest from '@/common/middleware/authenticate-request';
import GetAccountController from '../http/controller/get-account.controller';
import { hasPermission } from '@/common/middleware/permit-resource';
import { ResourceAction } from '@/common/enums';
import { Modules } from '@/common/utils/resourcePathBuilder';
import DeleteAccountController from '../http/controller/delete-account.controller';
import UpdateAccountController from '../http/controller/update-account.controller';

const accountRouter = Router();

accountRouter.use(authenticateRequest());

accountRouter
  .route('/')
  .get(
    hasPermission(
      Modules.users.children.user.children.profile.path,
      ResourceAction.READ
    ),
    requestHandler(new GetAccountController())
  )
  .put(
    hasPermission(
      Modules.users.children.user.children.profile.path,
      ResourceAction.UPDATE
    ),
    requestHandler(new UpdateAccountController())
  )
  .delete(
    hasPermission(
      Modules.users.children.user.children.profile.path,
      ResourceAction.DELETE
    ),
    requestHandler(new DeleteAccountController())
  );

export default accountRouter;
