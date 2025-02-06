import { SupportedLocales } from '@/types/global';
import { NotificationTemplate } from '@prisma/client';
import ITemplatesRepository from '../../application/repositories/templates-repository';
import { getDefaultPrismaClient } from '@/common/database';

class TemplatesRepository implements ITemplatesRepository {
  private readonly db = getDefaultPrismaClient();

  async getTemplateBySlug(
    slug: string,
    locale?: SupportedLocales
  ): Promise<NotificationTemplate | null> {
    return {
      content: 'Your one time otp code is {{otp}}',
      name: 'one time otp',
      slug: 'one-time-otp',
      createdAt: new Date(),
      createdBy: 'some user id',
      id: 'some cuid',
      params: ['otp'],
      title: 'Hello one timer',
      updatedAt: new Date(),
    };
  }
}

const templatesRepository = new TemplatesRepository();

export default templatesRepository;
