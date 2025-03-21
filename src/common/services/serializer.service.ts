// services/serializer.service.ts
import { Service } from 'typedi';
import { ClassConstructor, plainToInstance } from 'class-transformer';

@Service()
export class SerializerService {
  // Single entity overload

  serialize<T>(
    dtoClass: ClassConstructor<T>,
    entity: unknown,
    locale?: SupportedLocales
  ): T;
  // Array overload
  // eslint-disable-next-line no-dupe-class-members
  serialize<T>(
    dtoClass: ClassConstructor<T>,
    entities: unknown[],
    locale?: SupportedLocales
  ): T[];
  // Implementation
  // eslint-disable-next-line no-dupe-class-members
  serialize<T>(
    dtoClass: ClassConstructor<T>,
    input: unknown | unknown[],
    locale?: SupportedLocales
  ): T | T[] {
    return plainToInstance(dtoClass, input, {
      excludeExtraneousValues: true,
      locale,
      defaultLocale: 'en',
    });
  }
}
