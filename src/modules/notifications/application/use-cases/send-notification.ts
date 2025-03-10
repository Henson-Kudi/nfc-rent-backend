import NotificationRepository from '../repositories/notifications-repository';
import { NotificationChannelFactory } from '../../infrastructure/providers';
import { AppError, IReturnValue } from '@/common/utils';
import { SendNotificationDTO } from '../../domain';
import ITemplatesRepository from '../repositories/templates-repository';
import slugify from '@/common/utils/slugify';
import { renderNotificationTemplate } from '../../utils/compile-template';
import { NotificationMemoryCache } from '../../config/memory-cache';

export class SendNotification
  implements
    IUseCase<
      [SendNotificationDTO, Record<string, unknown>],
      IReturnValue<{ sent: boolean }>
    >
{
  constructor(
    private readonly notificationRepo: NotificationRepository,
    private readonly channelFactory: NotificationChannelFactory,
    private readonly templatesRepo: ITemplatesRepository,
    private readonly cache: NotificationMemoryCache
  ) {}

  async execute<T extends object>(
    input: SendNotificationDTO,
    templateOptions: T
  ): Promise<IReturnValue<{ sent: boolean }>> {
    const {
      recipient,
      recipientId,
      channel,
      priority,
      templateName,
      persist,
      sender,
      locale,
    } = input;
    input = new SendNotificationDTO(
      channel,
      recipient,
      recipientId,
      templateName,
      priority,
      persist,
      sender,
      locale
    );

    await input.validate();

    const templateSlug = slugify(input.templateName);

    let template = this.cache.get(
      `notification_template:${templateSlug}:${input?.locale || 'en'}`
    );

    if (!template) {
      const Template = await this.templatesRepo.getTemplateBySlug(
        templateSlug,
        input.locale || 'en'
      );

      if (!Template) {
        throw new AppError({
          statusCode: 500,
          message: 'Template not available',
        });
      }

      template = Template;

      this.cache.set(
        `notification_template:${templateSlug}:${input?.locale || 'en'}`,
        template
      );
    }

    const compiledTitle = template?.title
      ? renderNotificationTemplate(template?.title, {
          ...input,
          ...templateOptions,
        })
      : undefined;
    const compiledBody = renderNotificationTemplate(template?.content, {
      ...input,
      ...templateOptions,
    });

    let notification: Partial<any> & {
      content: string;
      receipientId: string;
      receipient: string;
    } = {
      title: compiledTitle,
      content: compiledBody,
      receipient: input.recipient,
      receipientId: input.recipientId,
    };

    if (input.persist) {
      notification = await this.notificationRepo.create({
        data: notification,
      });
    }

    console.log(compiledBody);

    const channelFactory = this.channelFactory.getChannel(input.channel);

    const sent = await channelFactory.send(notification);

    return new IReturnValue({
      success: sent,
      message: sent ? 'Notification sent' : 'Failed to send notification',
      data: { sent },
    });
  }
}
