import { AppError, IReturnValue } from '@/common/utils';
import { ResetPasswordDto } from '@/modules/auth/domain/dtos';
import { ResponseCodes } from '@/common/enums';
import logger from '@/common/utils/logger';
import { resetPassword } from '../../utils/messageTopics.json';
import { User } from '@/common/entities';
import { UserRepository } from '../../infrastructure/repositories/user.repository';

class ResetPassword
  implements IUseCase<[{ email: string }], IReturnValue<{ sent: true }>>
{
  constructor(
    // @Inject('global.datasource')
    private readonly userRepository: UserRepository,
    private readonly messageBroker: IMessageBroker,
    private readonly tokenManager: ITokenManager
  ) {}

  async execute(data: {
    email: string;
  }): Promise<IReturnValue<{ sent: true }>> {
    const input = new ResetPasswordDto(data);

    input.validate();

    const user = await this.userRepository.findOneBy({ email: data.email });

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
          data: { ...user, token: accessToken } as User & { token: string },
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
