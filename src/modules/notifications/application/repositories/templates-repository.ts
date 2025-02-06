import { SupportedLocales } from '@/types/global';
import { NotificationTemplate } from '@prisma/client';

export default interface ITemplatesRepository {
  getTemplateBySlug(
    slug: string,
    locale?: SupportedLocales
  ): Promise<NotificationTemplate | null>;
}
