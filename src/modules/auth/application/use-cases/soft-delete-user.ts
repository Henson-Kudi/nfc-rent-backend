import { IReturnValue } from '@/common/utils';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import logger from '@/common/utils/logger';
import { UserEvents } from '@/common/message-broker/events/user.events';

export class SoftDeleteUserUseCase
  implements IUseCase<[string], IReturnValue<boolean>>
{
  constructor(
    private readonly repo: UserRepository,
    private readonly messageBroker: IMessageBroker
  ) {}

  async execute(userId: string): Promise<IReturnValue<boolean>> {
    await this.repo.softDelete({
      id: userId,
    });

    try {
      this.messageBroker.publishMessage(UserEvents.account.deleted, { data: { userId } });
    } catch (err) {
      logger.error(`Failed to publish ${UserEvents.account.deleted} message`, err);
    }

    return new IReturnValue({
      success: true,
      data: true,
      message: 'User deleted',
    });
  }
}
