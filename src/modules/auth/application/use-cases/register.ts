import { DeFaultRoles, ResponseCodes } from '../../../../common/enums';
import { RegisterUserDto } from '../../domain/dtos';
import IPasswordManager from '../providers/passwordManager';
import IAuthUserRepository from '../repositories/auth';
import { userRegistered } from '../../utils/messageTopics.json';
import logger from '../../../../common/utils/logger';
import { AppError, IReturnValue } from '../../../../common/utils';
import { IMessageBroker, IUseCase } from '@/types/global';
import { LoginType, User } from '@prisma/client';
import { encryptData } from '@/common/utils/encryption';
import { OTPVERIFICATIONTYPES } from '../../domain/enums';
import { UserWithVerificationType } from '../../types';
import { DefaultOrganisationName } from '../../../../common/constants';
import slugify from '@/common/utils/slugify';
import { ORGANISATION_MODULE_NAMES } from '@/common/utils/randomNumber';

class RegisterUseCase
  implements
  IUseCase<
    [RegisterUserDto],
    IReturnValue<{
      requiresOtp: boolean;
      token: string; // encrypted user object
    }>
  > {
  private readonly userRepository: IAuthUserRepository;
  private readonly passwordManager: IPasswordManager;
  private readonly messageBroker: IMessageBroker;

  constructor(
    userRepository: IAuthUserRepository,
    passwordManager: IPasswordManager,
    messageBroker: IMessageBroker
  ) {
    this.userRepository = userRepository;
    this.passwordManager = passwordManager;
    this.messageBroker = messageBroker;
  }

  async execute(request: RegisterUserDto): Promise<
    IReturnValue<{
      requiresOtp: boolean;
      token: string; // encrypted user object
    }>
  > {
    request = new RegisterUserDto(request);
    // Validate request data
    await request.validate();

    // Fetch user by email or phone to ensure they do not exist already
    const user = await this.userRepository.findByEmailOrPhone(
      request.email,
      request.phone
    );

    // Ensure user does not exist by email or fone
    if (user) {
      const errorMessage =
        user.email === request.email?.toLowerCase()
          ? 'USer with email already exist!'
          : 'User with phone number already exist!';
      throw new AppError({
        message: errorMessage,
        statusCode: ResponseCodes.BadRequest,
      });
    }

    const password = await this.passwordManager.encryptPassword(
      request.password
    );

    const validPassword = await this.passwordManager.comparePasswords(
      request.confirmPassword,
      password
    );

    if (!validPassword) {
      throw new AppError({
        message: "Passwords don't match",
        statusCode: ResponseCodes.BadRequest,
      });
    }

    const { confirmPassword, ...rest } = request;

    const newUser = await this.userRepository.createUser({
      data: {
        ...rest,
        password,
        email: request.email.toLowerCase(),
        loginType: LoginType.EMAIL,
      },
    }) as User;

    // Create default organisation
    const orgName = DefaultOrganisationName

    await this.userRepository.updateUser({
      where: { id: newUser.id },
      data: {
        organisations: {
          create: {
            name: orgName,
            nameSlug: slugify(orgName),
            collaborators: {
              create: {
                collaboratorId: newUser.id,
                roles: [DeFaultRoles.OWNER]
              }
            },
            modules: {
              createMany: {
                data: Object.values(ORGANISATION_MODULE_NAMES).map(val => ({
                  name: val,
                  nameSlug: slugify(val)
                }))
              }
            }
          }
        }
      }
    })

    const encData: UserWithVerificationType = {
      ...(newUser),
      verificationType: OTPVERIFICATIONTYPES.EMAIL,
    };

    const encrypted = encryptData({
      data: encData,
    });

    // Publish user created event for otp code to be sent for email verification
    try {
      await this.messageBroker.publishMessage(userRegistered, {
        data: newUser,
      });
    } catch (err) {
      logger.error(`Failed to publish user created message`, err);
    }

    return new IReturnValue({
      success: true,
      message: 'User registered successfully',
      data: {
        requiresOtp: true,
        token: encrypted,
      },
    });
  }
}

export default RegisterUseCase;
