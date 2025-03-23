import { User } from '@/common/entities';
import { HtmlCompilerService } from '@/common/services/html-compiler.service';
import logger from '@/common/utils/logger';
import generateRandomNumber from '@/common/utils/randomNumber';
import { PasswordManagerToken } from '@/modules/auth/infrastructure/providers/password-manager';
import { OTPRepository } from '@/modules/auth/infrastructure/repositories/otp.repository';
import { NotificationService } from '@/modules/notifications/application/services';
import moment from 'moment';
import Container from 'typedi';

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
        `Invalid user object passed. Processing data will fail.`,
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

    user.code = otpCode;
  }

  const notificationsService = Container.get(NotificationService)
  const compilerService = Container.get(HtmlCompilerService)

  const otpType = user.otpType === 'email' ? 'EMAIL' : 'SMS';

  const templatePath = 'templates/auth/otp.html'
  const templateData = {
    username: user.fullName,
    otpCode: user.code,
    expiry: '15 minutes'
  }

  const compiledHtml = compilerService.compile(templatePath, templateData)

  try {
    const notificationData = user.otpType === 'email' ? {
      to: user?.email,
      html: compiledHtml,
      subject: 'On Time OTP Code',
    } : {
      body: `Your one time otp code is: ${user.code}.\nThis code will expire in 15minutes`,
      to: user.phone!
    }

    await notificationsService.send(
      otpType,
      notificationData
    );
  } catch (error) {
    logger.error((error as Error)?.message, error);
  }
};

export default handleRequestOtpMessage;
