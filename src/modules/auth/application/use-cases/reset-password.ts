import { AppError, IReturnValue } from '@/common/utils';
import { ResetPasswordDto } from '@/modules/auth/domain/dtos';
import { IMessageBroker, ITokenManager, IUseCase } from '@/types/global';
import IAuthUserRepository from '../repositories/auth';
import { ResponseCodes } from '@/common/enums';
import logger from '@/common/utils/logger';
import { resetPassword } from '../../utils/messageTopics.json';
import { User } from '@prisma/client';

class ResetPassword
  implements IUseCase<[ResetPasswordDto], IReturnValue<{ sent: true }>>
{
  private readonly userRepository: IAuthUserRepository;
  private readonly messageBroker: IMessageBroker;
  private readonly tokenManager: ITokenManager;

  constructor(
    userRepository: IAuthUserRepository,
    broker: IMessageBroker,
    tokenManager: ITokenManager
  ) {
    this.userRepository = userRepository;
    this.messageBroker = broker;
    this.tokenManager = tokenManager;
  }

  async execute(data: ResetPasswordDto): Promise<IReturnValue<{ sent: true }>> {
    data = new ResetPasswordDto(data);

    data.validate();

    const user = await this.userRepository.findByEmail(data.email);

    if (!user || !user.isActive || user.isDeleted) {
      throw new AppError({
        statusCode: ResponseCodes.BadRequest,
        message: 'User does not exist with this email',
      });
    }

    // if user exists, generate access token and send email to user
    const accessToken = this.tokenManager.generateToken(
      'ACCESS_TOKEN',
      {
        userId: user.id,
      },
      {}
    );

    try {
      await this.messageBroker.publishMessage<User & { token: string }>(
        resetPassword,
        {
          data: { ...user, token: accessToken },
        }
      );
    } catch (err) {
      logger.error('Failed to reset password', err);
    }

    return new IReturnValue({
      success: true,
      message: 'Check email for resetting password',
      data: { sent: true },
    });
  }
}

export default ResetPassword;
