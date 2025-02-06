import { AppError, IReturnValue } from '@/common/utils';
import { RequestOTPDto } from '@/modules/auth/domain/dtos';
import { IMessageBroker, IUseCase } from '@/types/global';
import IAuthUserRepository from '../repositories/auth';
import IPasswordManager from '../providers/passwordManager';
import { OTP, User } from '@prisma/client';
import { ResponseCodes } from '@/common/enums';
import generateRandomNumber from '@/common/utils/randomNumber';
import moment from 'moment';
import { requestOtp } from '../../utils/messageTopics.json';
import logger from '@/common/utils/logger';
import { UserWithVerificationType } from '../../types';
import { OTPVERIFICATIONTYPES } from '../../domain/enums';
import { encryptData } from '@/common/utils/encryption';

const BASE_WAIT_TIME = 120; // 2mins - 120seconds
const MAX_WAIT_TIME = 900; // 15mins - 900seconds

class ResendOtp
  implements IUseCase<[RequestOTPDto], IReturnValue<{ sent: boolean, token: string }>> {
  private readonly repository: IAuthUserRepository;
  private readonly passwordManager: IPasswordManager;
  private readonly messageBroker: IMessageBroker;

  constructor(
    repo: IAuthUserRepository,
    passwordManager: IPasswordManager,
    broker: IMessageBroker
  ) {
    this.repository = repo;
    this.passwordManager = passwordManager;
    this.messageBroker = broker;
  }

  async execute(
    param: RequestOTPDto
  ): Promise<IReturnValue<{ sent: boolean, token: string }>> {
    const data = new RequestOTPDto(param);

    const validData = await data.validate();

    let user: User | null = null;

    if (validData.userId) {
      user = await this.repository.findById(validData.userId);
    } else if (validData.email) {
      user = await this.repository.findByEmail(validData.email);
    } else if (validData.phone) {
      user = await this.repository.findByPhone(validData.phone)
    }

    if (!user) {
      throw new AppError({
        statusCode: ResponseCodes.BadRequest,
        message: 'User not found',
      });
    }

    let otp: OTP | null = await this.repository.getOtpCodeByUserId(user.id);

    const code = generateRandomNumber(6);
    const harshedOtp = await this.passwordManager.encryptPassword(code);

    if (otp) {
      const resendCount = otp.count;
      const lastResent = new Date(otp.updatedAt).getTime();

      const waitTime = Math.min(
        BASE_WAIT_TIME * Math.pow(2, resendCount),
        MAX_WAIT_TIME
      ); //THIS IS IN SECONDS

      const nextResendAllowed = lastResent + waitTime * 1000; // IN MILISECONDS

      const now = Date.now();

      if (nextResendAllowed > now) {
        throw new AppError({
          statusCode: ResponseCodes.BadRequest,
          message: `User must wait ${Math.ceil((nextResendAllowed - now) / 1000)} seconds before resending OTP.`,
        });
      }

      // Generate new otp code for security

      otp = await this.repository.updateOtpCode({
        where: { id: otp.id },
        data: {
          ...otp,
          count: otp.count + 1,
          expireAt: moment().add(15, 'minutes').toDate(),
          token: harshedOtp,
        },
      });
    } else {
      // Save token to db and
      otp = await this.repository.createOtp({
        data: {
          userId: user.id,
          token: harshedOtp,
          expireAt: moment().add(15, 'minutes').toDate(), // token expires after 10mins
        },
      });
    }

    if (!otp) {
      throw new AppError({
        statusCode: ResponseCodes.BadRequest,
        message: 'Failed to resend otp',
      });
    }

    const encData: UserWithVerificationType = {
      ...(user),
      verificationType: validData.type === 'email' ? OTPVERIFICATIONTYPES.EMAIL : OTPVERIFICATIONTYPES.PHONE,
    };

    const encrypted = encryptData({
      data: encData,
    });

    try {
      this.messageBroker.publishMessage<User & { code: string, otpType: 'email' | 'phone' }>(requestOtp, {
        data: {
          ...user,
          code,
          otpType: validData.type
        },
      });
    } catch (err) {
      logger.error(`Failed to publish ${requestOtp} message`, err);
    }

    return new IReturnValue({
      success: true,
      message: 'OTP sent successfully',
      data: { sent: true, token: encrypted },
    });
  }
}

export default ResendOtp;
