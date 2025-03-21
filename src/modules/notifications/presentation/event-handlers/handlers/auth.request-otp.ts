import { User } from '@/common/entities';
import logger from '@/common/utils/logger';
import generateRandomNumber from '@/common/utils/randomNumber';
import notificationsService from '@/modules/notifications/application/services';
import { SendNotificationDTO } from '@/modules/notifications/domain';

type OneTimeOtpParams = {
  otp: string;
};

const handleRequestOtpMessage: MessageHandler = async (message) => {
  let user: (User & { code: string; otpType: 'email' | 'phone' }) | null = null;

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

  if (!user?.code) {
    const otpCode = generateRandomNumber(6);
    // const hashedOtp = await passwordManager.encryptPassword(otpCode);
    // const otpExpireAt = moment().add(15, 'minutes').toDate();

    // await oTPRepository.create({
    //     data: {
    //         expireAt: otpExpireAt,
    //         token: hashedOtp,
    //         userId: user.id,
    //     },
    // });
    user.code = otpCode;
  }

  const otpType = user.otpType === 'email' ? 'EMAIL' : 'SMS';
  const receipient = user.otpType === 'email' ? user.email : user.phone!;

  try {
    await notificationsService.send(
      'EMAIL',
      { otp: user.code } as any
    );
  } catch (error) {
    logger.error((error as Error)?.message, error);
  }
};

export default handleRequestOtpMessage;
