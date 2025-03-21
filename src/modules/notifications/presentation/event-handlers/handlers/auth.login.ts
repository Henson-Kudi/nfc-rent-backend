import { User } from '@/common/entities';
import { OTPType } from '@/common/enums';
import logger from '@/common/utils/logger';
import generateRandomNumber from '@/common/utils/randomNumber';
import { PasswordManagerToken } from '@/modules/auth/infrastructure/providers/password-manager';
import { OTPRepository } from '@/modules/auth/infrastructure/repositories/otp.repository';
import notificationsService from '@/modules/notifications/application/services';
import { SendNotificationDTO } from '@/modules/notifications/domain';
import moment from 'moment';
import Container from 'typedi';

type OneTimeOtpParams = {
  otp: string;
};

const handleUserLoginMessage: MessageHandler = async (message) => {
  const passwordManager = Container.get(PasswordManagerToken);
  const OtpRepository = Container.get(OTPRepository);
  // generate otp code
  // hash the code
  // save in db
  // send email to user
  // acknowledge message
  let user: (User & { requiresOtp: boolean; otpType: OTPType }) | null = null;

  try {
    const userData = JSON.parse(message)?.data;
    if (userData && userData instanceof Object) {
      user = userData;
    } else {
      logger.warn(
        `Invalid user object passed. Processing data will fial.`,
        userData
      );
    }
  } catch (err) {
    logger.warn(`Invalid json data for user. Processing will fail`, err);
  }

  if (!user) {
    logger.error(`Invalid json data for user. Processing failed`);
    return;
  }

  if (user?.requiresOtp) {
    const otpCode = generateRandomNumber(6);
    const hashedOtp = await passwordManager.encryptPassword(otpCode);
    const otpExpireAt = moment().add(15, 'minutes').toDate();

    try {
      await OtpRepository.save(
        OtpRepository.create({
          expireAt: otpExpireAt,
          token: hashedOtp,
          userId: user.id,
          user,
        })
      );
      await notificationsService.send(
        'EMAIL',
        { otp: otpCode } as any
      );
    } catch (error) {
      logger.error(error);
    }
  }
};

export default handleUserLoginMessage;
