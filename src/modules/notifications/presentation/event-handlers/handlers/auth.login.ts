import { User } from '@/common/entities';
import { OTPType } from '@/common/enums';
import logger from '@/common/utils/logger';
import generateRandomNumber from '@/common/utils/randomNumber';
import notificationsService from '@/modules/notifications/application/services';
import { SendNotificationDTO } from '@/modules/notifications/domain';

type OneTimeOtpParams = {
  otp: string;
};

const handleUserLoginMessage: MessageHandler = async (message, channel) => {
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
    // const hashedOtp = await passwordManager.encryptPassword(otpCode);
    // const otpExpireAt = moment().add(15, 'minutes').toDate();

    try {
      // await oTPRepository.create({
      //   data: {
      //     expireAt: otpExpireAt,
      //     token: hashedOtp,
      //     userId: user.id,
      //   },
      // });
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
    } catch (error) {
      logger.error(error);
    }
  }
};

export default handleUserLoginMessage;
