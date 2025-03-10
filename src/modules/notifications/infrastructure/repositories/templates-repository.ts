import ITemplatesRepository from '../../application/repositories/templates-repository';

class TemplatesRepository implements ITemplatesRepository {
  async getTemplateBySlug(
    slug: string,
    locale?: SupportedLocales
  ): Promise<any | null> {
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
