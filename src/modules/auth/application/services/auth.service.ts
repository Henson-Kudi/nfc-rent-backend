import ChangePassword from '../use-cases/change-password';
import VerifyOtp from '../use-cases/verify-otp';
import ResetPassword from '../use-cases/reset-password';
import RequestOTP from '../use-cases/request-otp';
import RegisterUseCase from '../use-cases/register';
import RefreshAccessToken from '../use-cases/refresh-access-token';
import EnableTOTP from '../use-cases/enable-totp';
import Login from '../use-cases/login';
import GetAccount from '../use-cases/get-account';
import Logout from '../use-cases/logout';
import { Inject, Service } from 'typedi';
import { ChangePasswordDto, LoginDto, LogoutDTO, OTPVerificationDto, RegisterUserDto, RequestOTPDto, ResetPasswordDto } from '../../domain/dtos';
import IPasswordManager from '../providers/passwordManager';
import TOTPMFA from '../providers/totp';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { SessionRepository } from '../../infrastructure/repositories/session.repository';
import { GoogleServicesManagerToken } from '@/config/google';
import { OTPRepository } from '../../infrastructure/repositories/otp.repository';
import { MessageBrokerToken } from '@/common/message-broker';
import { PasswordManagerToken } from '../../infrastructure/providers/password-manager';
import { TokenManagerToken } from '@/common/jwt';
import { TOTPToken } from '../../infrastructure/providers/totp';
import { RoleRepository } from '../../infrastructure/repositories/role.repository';
import { SoftDeleteUserUseCase } from '../use-cases/soft-delete-user';
import { UpdateUserUseCase } from '../use-cases/update-user';

@Service()
export class AuthService {
  constructor(
    @Inject()
    private readonly userRepository: UserRepository,
    @Inject()
    private readonly roleRepository: RoleRepository,
    @Inject()
    private readonly sessionRepository: SessionRepository,
    @Inject()
    private readonly otpRepository: OTPRepository,
    @Inject(MessageBrokerToken)
    private readonly messageBroker: IMessageBroker,
    @Inject(PasswordManagerToken)
    private readonly passwordManager: IPasswordManager,
    @Inject(TokenManagerToken)
    private readonly tokenManager: ITokenManager,
    @Inject(TOTPToken)
    private readonly totpProvider: TOTPMFA,
    @Inject(GoogleServicesManagerToken)
    private readonly googleServicesManager: IGoogleServicesManager,
  ) { }


  changePassword(data: ChangePasswordData) {
    return new ChangePassword(this.userRepository, this.passwordManager, this.messageBroker).execute(data)
  };

  login(data: LoginData) {
    return new Login(this.userRepository, this.sessionRepository, this.messageBroker, this.passwordManager, this.tokenManager, this.googleServicesManager).execute(data)
  };

  logout(data: LogoutData) {
    return new Logout(this.sessionRepository, this.messageBroker).execute(data)
  };

  enableOtp(userId: string) {
    return new EnableTOTP(this.userRepository, this.totpProvider).execute(userId)
  };

  refreshAccessToken(refreshToken: string, device: string, location: string) {
    return new RefreshAccessToken(this.userRepository, this.sessionRepository, this.tokenManager).execute(refreshToken, device, location)
  };

  register(request: RegisterUserData) {
    return new RegisterUseCase(this.userRepository, this.roleRepository, this.passwordManager, this.messageBroker).execute(request)
  };

  requestOtp(params: RequestOTPData) {
    return new RequestOTP(this.userRepository, this.otpRepository, this.passwordManager, this.messageBroker).execute(params)
  };

  resetPassword(data: {email: string}) {
    return new ResetPassword(this.userRepository, this.messageBroker, this.tokenManager).execute(data)
  };

  verifyOtp(params: OTPValidationData) {
    return new VerifyOtp(this.userRepository, this.sessionRepository, this.otpRepository, this.passwordManager, this.totpProvider, this.tokenManager).execute(params)
  };

  getAccount(userId: string) {
    return new GetAccount(this.userRepository).execute(userId)
  };

  softDeleteUser(userId: string) {
    return new SoftDeleteUserUseCase(this.userRepository, this.messageBroker).execute(userId)
  }

  updateUser(userId: string, data: UpdateUserData) {
    return new UpdateUserUseCase(this.userRepository, this.messageBroker).execute(userId, data)
  }
}

