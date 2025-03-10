import { CarModel } from '@/common/entities';
import { Service, Token } from 'typedi';
import { DataSource, Repository } from 'typeorm';

type ModelSortField =
  | 'name'
  | 'createdAt'
  | 'updatedAt'
  | 'isActive'
  | 'isDeleted'
  | 'deletedAt';

type ModelFilterOptions = {
  locale?: SupportedLocales;
  limit: number;
  skip: number;
  sortBy?: ModelSortField;
  sortOrder?: 'ASC' | 'DESC';
};

type ModelFilter = {
  id?: string[];
  slug?: string[];
  search?: string;
};

export interface CarModelRepository extends Repository<CarModel> {
  getModels(
    filter?: ModelFilter,
    options?: ModelFilterOptions
  ): Promise<[CarModel[], number]>;

  getModel(id: string, locale?: SupportedLocales): Promise<CarModel>;

  getModelBySlug(slug: string, locale?: SupportedLocales): Promise<CarModel>;
}

export const ModelsRepositoryToken = new Token<CarModelRepository>();

function getModelsRepository(dataSource: DataSource) {
  return dataSource.getRepository(CarModel).extend({
    defaultLocale: 'en',

    getModels(
      filter?: ModelFilter,
      options: ModelFilterOptions = {
        locale: 'en',
        limit: 10,
        skip: 0,
        sortBy: 'createdAt',
        sortOrder: 'ASC',
      }
    ) {
      const {
        limit = 10,
        locale = 'en',
        skip = 0,
        sortBy = 'createdAt',
        sortOrder = 'ASC',
      } = options;

      const { slug, search, id } = filter || {};

      const query = this.getModelBaseQuery(locale || this.defaultLocale);

      if (slug && slug.length > 0)
        query.andWhere(`model.slug in (:...slug)`, { slug });

      if (id && id?.length > 0) query.andWhere(`model.id in (:...id)`, { id });

      if (search && search?.length > 0) {
        query.andWhere(
          `EXISTS (
              SELECT 1 FROM car_model_translation
              WHERE trans.parentId = model.id
              AND name ILIKE :searchTerm
            )`,
          { searchTerm: `%${search}%` }
        );
      }

      if (sortBy === 'name') {
        query
          .addSelect(
            `
                  CASE
                    WHEN trans.locale = :locale THEN 1
                    WHEN trans.locale = :fallbackLocale THEN 2
                    ELSE 3
                  END AS trans_priority`
          )
          .orderBy('MIN(trans.name)', sortOrder)
          .addOrderBy('trans_priority', 'ASC');
      } else {
        query.orderBy(`model.${sortBy}`, sortOrder);
      }

      return query
        .groupBy('model.id, trans.id, brand.id, brandtrans.id')
        .skip(skip)
        .take(limit)
        .setParameters({ locale, fallbackLocale: this.defaultLocale })
        .getManyAndCount();
    },

    getModel(id: string, locale?: SupportedLocales) {
      return this.getModelBaseQuery(locale)
        .where('model.id = :id', { id })
        .getOne();
    },

    getModelBySlug(slug: string, locale?: SupportedLocales) {
      return this.getModelBaseQuery(locale)
        .where('model.slug = :slug', { slug })
        .getOne();
    },

    getModelBaseQuery(locale?: SupportedLocales) {
      return this.createQueryBuilder('model').leftJoinAndSelect(
        'model.translations',
        'trans',
        'trans.locale IN (:...locales)',
        { locales: [locale || this.defaultLocale, this.defaultLocale] }
      ).leftJoinAndSelect('model.brand', 'brand')
        .leftJoinAndSelect(
          'brand.translations',
          'brandtrans',
          'brandtrans.locale = :locale',
          { locale: locale }
        )
    },
  });
}

@Service()
export class CarModelRepositoryFacrory {
  static create(dataSource: DataSource) {
    return dataSource
      .getRepository(CarModel)
      .extend(getModelsRepository(dataSource));
  }
}
