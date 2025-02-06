import { User, LoginType } from '@prisma/client';
import { DeFaultRoles, ResponseCodes } from '@/common/enums';
import { AppError } from '@/common/utils';
import { LoginDto } from '@/modules/auth/domain/dtos';
import IAuthUserRepository from '../repositories/auth';
import { OAuth2Client } from 'google-auth-library';
import envConf from '@/config/env.conf';
import { IMessageBroker } from '@/types/global';
import { userRegistered } from '../../utils/messageTopics.json'
import slugify from '@/common/utils/slugify';
import { DefaultOrganisationName } from '../../../../common/constants';

export default async function googleLogin(
  data: LoginDto,
  repo: IAuthUserRepository,
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

  let user = await repo.findByEmail(payload.email, {
    include: {
      collaborations: {
        include: {
          organisation: true
        }
      }
    }
  });

  // If no user, create a new user
  if (!user) {
    let newuser = await repo.createUser({
      data: {
        email: payload.email,
        emailVerified: payload.email_verified || false,
        loginType: LoginType.GOOGLE,
        phone: '',
        phoneVerified: false,
        googleId: payload.sub,
        isActive: true,
        photo: payload.picture,
        firstName: payload?.family_name || payload?.name || 'No FN',
        lastName: payload?.given_name || 'No LN',
      }
    });


    if (!newuser) {
      throw new AppError({
        statusCode: ResponseCodes.BadRequest,
        message: 'Failed to login with token',
      });
    }

    // Create default organisation for this user
    const orgName = DefaultOrganisationName

    newuser = await repo.updateUser({
      where: { id: newuser.id },
      data: {
        organisations: {
          create: {
            name: orgName,
            nameSlug: slugify(orgName),
            collaborators: {
              create: {
                collaboratorId: newuser.id,
                roles: [DeFaultRoles.OWNER],
              }
            }

          }
        }
      },
      include: {
        collaborations: {
          include: {
            organisation: true
          }
        }
      }
    }) as User

    user = newuser;
  }


  // Because user is a google user, if their email is verified, we just verify our user's email as well since we're now sure the user can receive emails.
  user = (await repo.updateUser({
    where: { id: user.id },
    data: {
      emailVerified: true,
      googleId: payload.sub,
      loginType: LoginType.GOOGLE,
      photo: user?.photo || payload.picture //maintain current photo (if any) or use google photo
    },
    include: {
      collaborations: {
        include: {
          organisation: true
        }
      }
    }
  })) as User;

  return user;
}
