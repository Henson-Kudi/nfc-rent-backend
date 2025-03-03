import { AppError, IReturnValue } from '@/common/utils';
import { ChangePasswordDto } from '@/modules/auth/domain/dtos';
import IPasswordManager from '../providers/passwordManager';
import { ResponseCodes } from '@/common/enums';
import logger from '@/common/utils/logger';
import { passwordChanged } from '../../utils/messageTopics.json';
import { UserRepository } from '../../infrastructure/repositories/user.repository';

class ChangePassword
  implements IUseCase<[ChangePasswordData], IReturnValue<{ success: boolean }>> {

  constructor(
    private readonly repository: UserRepository,
    private readonly passwordManager: IPasswordManager,
    private readonly messageBroker: IMessageBroker
  ) { }

  async execute(
    data: ChangePasswordData
  ): Promise<IReturnValue<{ success: boolean }>> {
    const input = new ChangePasswordDto(data);

    await input.validate();

    let user = await this.repository.findOneBy({ id: data.userId });

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

    await this.repository.update({ id: user.id }, {
      password: newPassword,
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
