import { User } from '@/common/entities';
import logger from '@/common/utils/logger';
import generateRandomNumber from '@/common/utils/randomNumber';
import slugify from '@/common/utils/slugify';
import { PasswordManagerToken } from '@/modules/auth/infrastructure/providers/password-manager';
import { OTPRepository } from '@/modules/auth/infrastructure/repositories/otp.repository';
import { RoleRepository } from '@/modules/auth/infrastructure/repositories/role.repository';
import { UserRepository } from '@/modules/auth/infrastructure/repositories/user.repository';
import notificationsService from '@/modules/notifications/application/services';
import { SendNotificationDTO } from '@/modules/notifications/domain';
import moment from 'moment';
import Container from 'typedi';

type OneTimeOtpParams = {
  otp: string;
};

const handleUserRegistereMessage: MessageHandler = async (message, channel) => {
  try {
    const repo = Container.get(OTPRepository);
    const passwordManager = Container.get(PasswordManagerToken);
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

    const otp = repo.create({
      expireAt: otpExpireAt,
      token: hashedOtp,
      userId: user.id,
      count: 1,
    });

    await repo.save(otp);

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
  } catch (err: any) {
    logger.error(err?.message, err);
  }
};

export default handleUserRegistereMessage;
