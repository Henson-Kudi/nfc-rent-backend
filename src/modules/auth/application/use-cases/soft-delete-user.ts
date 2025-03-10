import { IReturnValue } from '@/common/utils';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { userDeleted } from '../../utils/messageTopics.json';
import logger from '@/common/utils/logger';

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
      this.messageBroker.publishMessage(userDeleted, { data: { userId } });
    } catch (err) {
      logger.error(`Failed to publish ${userDeleted} message`, err);
    }

    return new IReturnValue({
      success: true,
      data: true,
      message: 'User deleted',
    });
  }
}
