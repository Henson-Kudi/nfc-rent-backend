import { AppError } from '@/common/utils';
import Handlebars from 'handlebars';

export const renderNotificationTemplate = (
  templateContent: string,
  data: Record<string, unknown>
) => {
  const compiledTemplate = Handlebars.compile(templateContent);

  const renderedMessage = compiledTemplate(data);

  // Ensure no leftover placeholders
  if (/\{\{.*?\}\}/.test(renderedMessage)) {
    throw new AppError({
      statusCode: 500,
      message: 'Some placeholders are not filled in the template.',
    });
  }

  return renderedMessage;
};
