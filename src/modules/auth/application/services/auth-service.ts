import { IMessageBroker, ITokenManager } from '@/types/global';
import IAuthUserRepository from '../repositories/auth';
import IPasswordManager from '../providers/passwordManager';
import ChangePassword from '../use-cases/change-password';
import VerifyOtp from '../use-cases/verify-otp';
import ResetPassword from '../use-cases/reset-password';
import RequestOTP from '../use-cases/request-otp';
import RegisterUseCase from '../use-cases/register';
import RefreshAccessToken from '../use-cases/refresh-access-token';
import EnableTOTP from '../use-cases/enable-totp';
import Login from '../use-cases/login';
import TOTPMFA from '../providers/totp';
import repo from '@/modules/auth/infrastructure/repositories/auth-user';
import messageBroker from '@/common/message-broker';
import passwordManager from '@/modules/auth/infrastructure/providers/password-manager';
import tokenManager from '@/common/jwt';
import totp from '@/modules/auth/infrastructure/providers/totp';
import GetAccount from '../use-cases/get-account';
import Logout from '../use-cases/logout';

class AuthService {
  private readonly repo: IAuthUserRepository;
  private readonly tokenManager: ITokenManager;
  private readonly passwordManager: IPasswordManager;
  private readonly messageBroker: IMessageBroker;
  private readonly totp: TOTPMFA;

  constructor(init: {
    repo: IAuthUserRepository;
    tokenManager: ITokenManager;
    passwordManager: IPasswordManager;
    messageBroker: IMessageBroker;
    totp: TOTPMFA;
  }) {
    this.repo = init.repo;
    this.tokenManager = init.tokenManager;
    this.passwordManager = init.passwordManager;
    this.messageBroker = init.messageBroker;
    this.totp = init.totp;

    this.changePassword = new ChangePassword(
      this.repo,
      this.passwordManager,
      this.messageBroker
    );

    this.login = new Login(
      this.repo,
      this.messageBroker,
      this.passwordManager,
      this.tokenManager
    );

    this.logout = new Logout(
      this.repo,
      this.messageBroker
    );

    this.enableOtp = new EnableTOTP(this.repo, this.totp);

    this.refreshAccessToken = new RefreshAccessToken(
      this.repo,
      this.tokenManager
    );

    this.register = new RegisterUseCase(
      this.repo,
      this.passwordManager,
      this.messageBroker
    );

    this.requestOtp = new RequestOTP(
      this.repo,
      this.passwordManager,
      this.messageBroker
    );

    this.resetPassword = new ResetPassword(
      this.repo,
      this.messageBroker,
      this.tokenManager
    );

    this.verifyOtp = new VerifyOtp(
      this.repo,
      this.passwordManager,
      this.totp,
      this.tokenManager
    );

    this.getAccount = new GetAccount(this.repo);
  }

  changePassword: ChangePassword;
  login: Login;
  logout: Logout;
  enableOtp: EnableTOTP;
  refreshAccessToken: RefreshAccessToken;
  register: RegisterUseCase;
  requestOtp: RequestOTP;
  resetPassword: ResetPassword;
  verifyOtp: VerifyOtp;
  getAccount: GetAccount;
}

const authService = new AuthService({
  repo,
  messageBroker,
  passwordManager,
  tokenManager,
  totp,
});

export default authService;
