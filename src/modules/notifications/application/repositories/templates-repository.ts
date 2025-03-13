export default interface ITemplatesRepository {
  getTemplateBySlug(
    slug: string,
    locale?: SupportedLocales
  ): Promise<any | null>;
}
