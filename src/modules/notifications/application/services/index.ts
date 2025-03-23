import { Inject, Service } from 'typedi';
import { NotificationType } from '../../types';
import { NotificationRepository } from '../repositories/notifications-repository';
import { NotificationChannelsFactory } from './index.channel';
import { User } from '@/common/entities';
import { AppError } from '@/common/utils';
import { ResponseCodes } from '@/common/enums';

type SendNotificationPayload<T extends NotificationType> = T extends 'EMAIL' ? SendEmailNotification :
  T extends 'SMS' ? SendSMSNotification :
  SendPushNotification

@Service()
export class NotificationService {
  private readonly factory: NotificationChannelsFactory = new NotificationChannelsFactory();

  constructor(
    @Inject()
    private readonly notificationRepository: NotificationRepository
  ) { }

  send<T extends NotificationType>(
    type: T,
    payload: SendNotificationPayload<T>,
    persist?: false
  ): Promise<boolean>
  send<T extends NotificationType>(
    type: T,
    payload: SendNotificationPayload<T>,
    persist: true,
    sender: User,
    receiver: User
  ): Promise<boolean>
  async send<T extends NotificationType>(
    type: T,
    payload: SendNotificationPayload<T>,
    persist: boolean = false,
    sender?: User,
    receiver?: User
  ): Promise<boolean> {
    const channel = this.factory.getChannel(type);

    const validPayload = await channel.validate(payload)

    const result = await channel.send(validPayload);

    if (persist) {
      if (!sender || !receiver) {
        throw new AppError({
          message: "Message sent but not persisted. Invalid sender or receiver",
          statusCode: ResponseCodes.BadRequest
        })
      }

      await this.notificationRepository.save(this.notificationRepository.create({
        receiver,
        sender,
        type,
        content: payload,
      }))
    }

    return result;
  }
}
