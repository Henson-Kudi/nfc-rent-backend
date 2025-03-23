import { AppError, IReturnValue } from '@/common/utils';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import logger from '@/common/utils/logger';
import { ResponseCodes } from '@/common/enums';
import { UpdateUserDTO } from '@/common/dtos';
import { UserEvents } from '@/common/message-broker/events/user.events';

export class UpdateUserUseCase
  implements
    IUseCase<
      [string, UpdateUserData],
      IReturnValue<{ id: string; updated: UpdateUserData }>
    >
{
  constructor(
    private readonly repo: UserRepository,
    private readonly messageBroker: IMessageBroker
  ) {}

  async execute(
    userId: string,
    data: UpdateUserData
  ): Promise<IReturnValue<{ id: string; updated: UpdateUserData }>> {
    const validData = await new UpdateUserDTO(data).validate();

    if (validData.fullName && validData.fullName.length < 2) {
      throw new AppError({
        statusCode: ResponseCodes.ValidationError,
        message: 'Full name cannot be less than 2 characters.',
      });
    }

    await this.repo.update(userId, validData);

    try {
      this.messageBroker.publishMessage(UserEvents.account.updated, {
        data: { id: userId, updated: validData },
      });
    } catch (error) {
      logger.error(`Failed to publish ${UserEvents.account.updated} event`, error);
    }

    return new IReturnValue({
      success: true,
      data: {
        id: userId,
        updated: validData,
      },
      message: 'Profile updated successfully',
    });
  }
}
