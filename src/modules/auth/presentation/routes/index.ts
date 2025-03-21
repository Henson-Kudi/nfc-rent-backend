import requestHandler from '@/common/request/adapter';
import { Router } from 'express';
import RegisterUserController from '../http/controller/register.controller';
import LoginController from '../http/controller/login.controller';
import ChangePasswordController from '../http/controller/change-password.controller';
import authenticateRequest from '@/common/middleware/authenticate-request';
import EnableTOTPController from '../http/controller/enable-totp.controller';
import RefreshAccessTokenController from '../http/controller/refresh-access-token.controller';
import RequestOTPController from '../http/controller/request-otp.controller';
import ResetPasswordController from '../http/controller/reset-password.controller';
import VerifyOTPController from '../http/controller/verify-otp.controller';
import { requestHandlerWithCookie } from './handler';
import LogoutController from '../http/controller/logout.controller';
import { ResponseCodes } from '@/common/enums';

const router = Router();

router.post('/register', requestHandler(new RegisterUserController()));

router.post('/login', requestHandlerWithCookie(new LoginController()));

router.post(
  '/change-password',
  authenticateRequest(),
  requestHandler(new ChangePasswordController())
);

router.post(
  '/enable-totp',
  authenticateRequest(),
  requestHandler(new EnableTOTPController())
);

router.post(
  '/refresh-token',
  requestHandlerWithCookie(new RefreshAccessTokenController())
);

router.post('/request-otp', requestHandler(new RequestOTPController()));

router.post('/reset-password', requestHandler(new ResetPasswordController()));

router.post('/verify-otp', requestHandlerWithCookie(new VerifyOTPController()));

router.post('/logout', authenticateRequest(), async (req, res, next) => {
  try {
    res.clearCookie('refresh-token');

    const result = await new LogoutController().handle(req);

    res.status(ResponseCodes.Success).json(result);
  } catch (_) {
    res
      .status(ResponseCodes.Success)
      .json({ success: true, message: 'Logged out successfully' });
  }

  next();
});

export default router;
