import { LoginType, ResponseCodes } from '@/common/enums';
import { AppError } from '@/common/utils';
import { LoginDto } from '@/modules/auth/domain/dtos';
import { OAuth2Client } from 'google-auth-library';
import envConf from '@/config/env.conf';
import logger from '@/common/utils/logger';
import { userRegistered } from '../../utils/messageTopics.json';
import { User } from '@/common/entities';
import { UserRepository } from '../../infrastructure/repositories/user.repository';

export default async function googleLogin(
  data: LoginDto,
  repo: UserRepository,
  authClient: OAuth2Client,
  messageBroker: IMessageBroker
): Promise<User> {
  if (!data.idToken) {
    throw new AppError({
      message: 'Invalid login credentials',
      statusCode: ResponseCodes.BadRequest,
    });
  }

  // Verify the token
  let ticket = await authClient.verifyIdToken({
    idToken: data.idToken,
    audience: envConf.google.oauthClientId,
  });

  const payload = ticket.getPayload();

  if (!payload || !payload.email || !payload.email_verified) {
    throw new AppError({
      message: 'Invalid authentication token',
      statusCode: ResponseCodes.BadRequest,
    });
  }

  let user = await repo.findOne({ where: { email: payload.email } });

  // If no user, create a new user
  if (!user) {
    user = await repo.save(
      repo.create({
        email: payload.email.toLowerCase(),
        emailVerified: true,
        fullName:
          payload?.name ||
          `${payload?.family_name} ${payload?.given_name}`.trim() ||
          'No Name',
        googleId: payload.sub,
        phone: undefined,
        phoneVerified: false,
        isActive: true,
        loginType: LoginType.GOOGLE,
        photo: payload.picture,
        mfaEnabled: false,
      })
    );

    if (!user) {
      throw new AppError({
        statusCode: ResponseCodes.BadRequest,
        message: 'Failed to login with token',
      });
    }

    try {
      await messageBroker.publishMessage(userRegistered, {
        data: user,
      });
    } catch (err) {
      logger.error(`Failed to publish user created message`, err);
    }
  }

  return user;
}
