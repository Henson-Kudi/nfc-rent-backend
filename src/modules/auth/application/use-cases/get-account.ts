import { IReturnValue } from '@/common/utils';
import { User } from '@/common/entities';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { instanceToPlain } from 'class-transformer';

class GetAccount implements IUseCase<[string], IReturnValue<User | null>> {
  constructor(private readonly repo: UserRepository) {}

  async execute(userId: string): Promise<IReturnValue<User | null>> {
    const user = await this.repo.findOne({
      where: { id: userId },
      select: {
        password: false,
      },
    });

    return new IReturnValue({
      success: true,
      data: user ? (instanceToPlain(user) as User) : null,
      message: 'Found user.',
    });
  }
}

export default GetAccount;
