import { LoginType, ResponseCodes } from '../../../../common/enums';
import { RegisterUserDto } from '../../domain/dtos';
import IPasswordManager from '../providers/passwordManager';
import { userRegistered } from '../../utils/messageTopics.json';
import logger from '../../../../common/utils/logger';
import { AppError, IReturnValue } from '../../../../common/utils';
import { encryptData } from '@/common/utils/encryption';
import { OTPVERIFICATIONTYPES } from '../../domain/enums';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { RoleRepository } from '../../infrastructure/repositories/role.repository';
import slugify from '@/common/utils/slugify';
import { Role, User } from '@/common/entities';
import { In } from 'typeorm';
import { instanceToPlain } from 'class-transformer';

class RegisterUseCase
  implements
    IUseCase<
      [RegisterUserData],
      IReturnValue<{
        requiresOtp: boolean;
        token: string; // encrypted user object
      }>
    >
{
  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
    private readonly passwordManager: IPasswordManager,
    private readonly messageBroker: IMessageBroker
  ) {}

  async execute(request: RegisterUserData): Promise<
    IReturnValue<{
      requiresOtp: boolean;
      token: string; // encrypted user object
    }>
  > {
    const data = new RegisterUserDto(request);
    // Validate request data
    await data.validate();

    // Fetch user by email or phone to ensure they do not exist already
    let user = await this.userRepository.findOneBy({
      email: request.email,
    });

    if (!user) {
      user = await this.userRepository.findOneBy({
        phone: request.phone,
      });
    }

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

    const { roles, ...rest } = request;

    // We need to attach default user role to this user if roles where not set in request
    let userRoles: Role[] = await this.roleRepository.find({
      where: { slug: slugify('USER') },
      relations: ['permissions'],
    });

    // If any additional roles were passed, add it to user
    if (roles?.length) {
      userRoles = userRoles.concat(
        await this.roleRepository.find({
          where: { id: In(roles) },
          relations: ['permissions'],
        })
      );
    }

    let newUser = this.userRepository.create({
      ...rest,
      password,
      email: request.email.toLowerCase(),
      loginType: LoginType.EMAIL,
      roles: userRoles,
      cachedPermissions: userRoles
        ?.map((r) => r.permissions?.map((p) => p.identifier))
        .flat(),
    });

    const savedUser = instanceToPlain(
      await this.userRepository.save(newUser)
    ) as User;

    const encData = {
      ...savedUser,
      verificationType: OTPVERIFICATIONTYPES.EMAIL,
    };

    const encrypted = encryptData({
      data: encData,
    });

    // Publish user created event for otp code to be sent for email verification
    try {
      await this.messageBroker.publishMessage(userRegistered, {
        data: savedUser,
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
