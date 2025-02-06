import { AppError, IReturnValue } from '@/common/utils';
import { ChangePasswordDto } from '@/modules/auth/domain/dtos';
import { IMessageBroker, IUseCase } from '@/types/global';
import IAuthUserRepository from '../repositories/auth';
import IPasswordManager from '../providers/passwordManager';
import { ResponseCodes } from '@/common/enums';
import logger from '@/common/utils/logger';
import { passwordChanged } from '../../utils/messageTopics.json';

class ChangePassword
  implements IUseCase<[ChangePasswordDto], IReturnValue<{ success: boolean }>>
{
  private readonly repository: IAuthUserRepository;
  private readonly passwordManager: IPasswordManager;
  private readonly messageBroker: IMessageBroker;

  constructor(
    repo: IAuthUserRepository,
    passwordManager: IPasswordManager,
    messageBroker: IMessageBroker
  ) {
    this.repository = repo;
    this.passwordManager = passwordManager;
    this.messageBroker = messageBroker;
  }

  async execute(
    data: ChangePasswordDto
  ): Promise<IReturnValue<{ success: boolean }>> {
    data = new ChangePasswordDto(data);

    await data.validate();

    let user = await this.repository.findById(data.userId);

    if (!user || !user.isActive || user.isDeleted) {
      throw new AppError({
        statusCode: ResponseCodes.BadRequest,
        message: 'User does not exist',
      });
    }

    if (data.oldPassword) {
      const valid = await this.passwordManager.comparePasswords(
        data.oldPassword,
        user.password || ''
      );

      if (!valid) {
        throw new AppError({
          message: "Passwords don't match",
          statusCode: ResponseCodes.BadRequest,
        });
      }
    }

    const newPassword = await this.passwordManager.encryptPassword(
      data.newPassword
    );

    const validNewPass = await this.passwordManager.comparePasswords(
      data.confirmNewPassword,
      newPassword
    );

    if (!validNewPass) {
      throw new AppError({
        message: "Passwords don't match",
        statusCode: ResponseCodes.BadRequest,
      });
    }

    user.password = newPassword;

    await this.repository.updateUser({
      where: { id: user.id },
      data: {
        password: newPassword,
      },
    });

    // Publish password changed event
    try {
      await this.messageBroker.publishMessage(passwordChanged, { data: user });
    } catch (err) {
      logger.error('Failed to publish password changed event', err);
    }

    return new IReturnValue({
      success: true,
      message: 'Password changed successfully',
      data: { success: true },
    });
  }
}

export default ChangePassword;
