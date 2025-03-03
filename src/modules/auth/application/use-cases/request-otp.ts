import { AppError, IReturnValue } from '@/common/utils';
import { RequestOTPDto } from '@/modules/auth/domain/dtos';
import IPasswordManager from '../providers/passwordManager';
import { ResponseCodes } from '@/common/enums';
import generateRandomNumber from '@/common/utils/randomNumber';
import moment from 'moment';
import { requestOtp } from '../../utils/messageTopics.json';
import logger from '@/common/utils/logger';
import { OTPVERIFICATIONTYPES } from '../../domain/enums';
import { encryptData } from '@/common/utils/encryption';
import { Repository } from 'typeorm';
import { OTP, User } from '@/common/entities';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { OTPRepository } from '../../infrastructure/repositories/otp.repository';
import { instanceToPlain } from 'class-transformer';

const BASE_WAIT_TIME = 120; // 2mins - 120seconds
const MAX_WAIT_TIME = 900; // 15mins - 900seconds

// @Service('auth.requestOtp.use-case')
class RequestOTP implements IUseCase<[RequestOTPData], IReturnValue<{ sent: boolean, token: string }>> {


  constructor(
    private readonly repository: UserRepository,
    private readonly otpRepo: OTPRepository,
    private readonly passwordManager: IPasswordManager,
    private readonly messageBroker: IMessageBroker,
  ) { }

  async execute(
    param: RequestOTPData
  ): Promise<IReturnValue<{ sent: boolean, token: string }>> {
    const data = new RequestOTPDto(param);

    const validData = await data.validate();

    let user: User | null = null;

    if (validData.userId) {
      user = await this.repository.findOneBy({ id: validData.userId });
    } else if (validData.email) {
      user = await this.repository.findOneBy({ email: validData.email });
    } else if (validData.phone) {
      user = await this.repository.findOneBy({ phone: validData.phone })
    }

    if (!user) {
      throw new AppError({
        statusCode: ResponseCodes.BadRequest,
        message: 'User not found',
      });
    }

    user = instanceToPlain(user) as User

    let otp: OTP | null = await this.otpRepo.findOneBy({ userId: user.id });

    const code = generateRandomNumber(6);
    const harshedOtp = await this.passwordManager.encryptPassword(code);

    if (otp) {
      const resendCount = otp.count;
      const lastResent = new Date(otp.updatedAt!).getTime();

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
      const expireAt = moment().add(15, 'minutes').toDate()

      await this.otpRepo.update({ id: otp.id }, {
        ...otp,
        count: otp.count + 1,
        expireAt: expireAt,
        token: harshedOtp,
      });

      otp.expireAt = expireAt
      otp.token = harshedOtp
      otp.count += 1
    } else {
      // Save token to db and
      otp = this.otpRepo.create({
        userId: user.id,
        token: harshedOtp,
        expireAt: moment().add(15, 'minutes').toDate(), // token expires after 10mins
      });

      await this.otpRepo.save(otp)
    }

    if (!otp) {
      throw new AppError({
        statusCode: ResponseCodes.BadRequest,
        message: 'Failed to resend otp',
      });
    }

    const encData = {
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
        } as User & { code: string, otpType: 'email' | 'phone' },
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

export default RequestOTP;
