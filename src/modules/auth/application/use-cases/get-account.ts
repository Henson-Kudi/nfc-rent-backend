import { IUseCase } from '@/types/global';
import { User } from '@prisma/client';
import IAuthUserRepository from '../repositories/auth';
import { IReturnValue } from '@/common/utils';

class GetAccount implements IUseCase<[string], IReturnValue<User | null>> {
  constructor(private readonly repo: IAuthUserRepository) {}

  async execute(userId: string): Promise<IReturnValue<User | null>> {
    const user = await this.repo.findById(userId, {
      include: {
        collaborations: {
          include: {
            organisation: true
          }
        }
      }
    });

    return new IReturnValue({
      success: true,
      data: user,
      message: 'Found user.',
    });
  }
}

export default GetAccount;
