import { User } from '@prisma/client';
import { AppError, IReturnValue } from '@/common/utils';
import { TokenDto } from '@/modules/auth/domain/dtos';
import { ITokenManager, IUseCase } from '@/types/global';
import IAuthUserRepository from '../repositories/auth';
import { ResponseCodes } from '@/common/enums';
import moment from 'moment';

class RefreshAccessToken
  implements IUseCase<[string, string, string], IReturnValue<User & TokenDto>> {
  private readonly repository: IAuthUserRepository;
  private readonly tokenManager: ITokenManager;

  constructor(repo: IAuthUserRepository, tokenManager: ITokenManager) {
    this.repository = repo;
    this.tokenManager = tokenManager;
  }

  async execute(
    refreshToken: string,
    device: string,
    location: string
  ): Promise<IReturnValue<User & TokenDto>> {
    const verifiedToken = this.tokenManager.verifyJwtToken(
      'REFRESH_TOKEN',
      refreshToken
    );

    const user = await this.repository.findById(verifiedToken.userId, {
      include: {
        collaborations: {
          include: {
            organisation: true
          }
        }
      }
    });

    // Session must be available. Token can only come from a session
    let session = await this.repository.findUserSession({
      where: {
        userId_device: {
          userId: verifiedToken.userId,
          device,
        },
      },
    });

    if (!user || !user.isActive || user.isDeleted || !session) {
      throw new AppError({
        statusCode: ResponseCodes.BadRequest,
        message: 'User not found',
      });
    }

    // if session will expire in the next 20mins, refresh the session token
    const accessToken = this.tokenManager.generateToken(
      'ACCESS_TOKEN',
      { userId: user.id },
      {}
    );

    const decodedِAccessToken = this.tokenManager.decodeJwtToken(refreshToken);
    const accessTokenExpiry = new Date(
      (decodedِAccessToken.exp as number) * 1000
    );

    const _20mins = 1000 * 60 * 20; //20mins in miliseconds
    const tokenExp = moment(session.expiresAt).toDate().getTime();
    const now = Date.now();
    const timeDiff = tokenExp - now;

    if (timeDiff <= _20mins) {
      const refreshToken = this.tokenManager.generateToken(
        'REFRESH_TOKEN',
        { userId: session.userId },
        {}
      );

      const decodedRefreshToken =
        this.tokenManager.decodeJwtToken(refreshToken);
      const refreshTokenExpiry = new Date(
        (decodedRefreshToken.exp as number) * 1000
      );

      session = await this.repository.updateUserSession({
        where: {
          id: session.id,
        },
        data: {
          refreshToken: refreshToken,
          expiresAt: refreshTokenExpiry,
          lastActiveAt: new Date(),
        },
      });
    }

    if (!session) {
      throw new AppError({
        message: 'Failed to refresh session',
        statusCode: ResponseCodes.ServerError,
      });
    }

    return new IReturnValue({
      success: true,
      message: 'Refresh token refreshed successfully',
      data: {
        ...user,
        accessToken: {
          value: accessToken,
          expireAt: accessTokenExpiry,
        },
        refreshToken: {
          value: session?.refreshToken,
          expireAt: session.expiresAt,
        },
      },
    });
  }
}

export default RefreshAccessToken;
