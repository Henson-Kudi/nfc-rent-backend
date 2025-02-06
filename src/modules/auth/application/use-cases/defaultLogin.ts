import { User } from '@prisma/client';
import { ResponseCodes } from '@/common/enums';
import { AppError } from '@/common/utils';
import { LoginDto } from '@/modules/auth/domain/dtos';
import IPasswordManager from '../providers/passwordManager';
import IAuthUserRepository from '../repositories/auth';

export default async function defaultLogin(
  data: LoginDto,
  repo: IAuthUserRepository,
  passwordManager: IPasswordManager
): Promise<User> {
  if (!data.email || !data.password) {
    throw new AppError({
      message: 'Invalid login credentials',
      statusCode: ResponseCodes.BadRequest,
    });
  }

  const user = await repo.findByEmail(data.email, {
    include: {
      collaborations: {
        include: {
          organisation: true
        }
      }
    }
  });

  if (!user || !user?.password) {
    throw new AppError({
      statusCode: ResponseCodes.BadRequest,
      message: 'Invalid credentials',
    });
  }

  const validPassword = await passwordManager.comparePasswords(
    data.password,
    user.password
  );

  if (!validPassword) {
    throw new AppError({
      statusCode: ResponseCodes.BadRequest,
      message: 'Invalid credentials',
    });
  }

  return user;
}
