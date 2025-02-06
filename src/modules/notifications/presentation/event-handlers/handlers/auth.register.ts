import logger from '@/common/utils/logger';
import generateRandomNumber from '@/common/utils/randomNumber';
import passwordManager from '@/modules/auth/infrastructure/providers/password-manager';
import notificationsService from '@/modules/notifications/application/services';
import { SendNotificationDTO } from '@/modules/notifications/domain';
import oTPRepository from '@/modules/notifications/infrastructure/repositories/otp-repository';
import { MessageHandler } from '@/types/global';
import { User } from '@prisma/client';
import moment from 'moment';

type OneTimeOtpParams = {
  otp: string;
};

const handleUserRegistereMessage: MessageHandler = async (message, channel) => {
  console.log(`Message: ${message}...... Channel: ${channel}`);
  // generate otp code
  // hash the code
  // save in db
  // send email to user
  // acknowledge message
  let user: User | null = null;

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

  const otpCode = generateRandomNumber(6);
  const hashedOtp = await passwordManager.encryptPassword(otpCode);
  const otpExpireAt = moment().add(15, 'minutes').toDate();

  await oTPRepository.create({
    data: {
      expireAt: otpExpireAt,
      token: hashedOtp,
      userId: user.id,
    },
  });

  await notificationsService.sendNotification.execute<OneTimeOtpParams>(
    new SendNotificationDTO(
      'EMAIL',
      user.email,
      user.id,
      'one time otp',
      'HIGH',
      false,
      undefined,
      'en'
    ),
    { otp: otpCode }
  );
};

export default handleUserRegistereMessage;
