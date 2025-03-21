import { CarFeature } from '@/common/entities';
import { FeatureCategory } from '@/common/enums';
import { Service, Token } from 'typedi';
import { DataSource, Repository } from 'typeorm';

type FeatureSortField =
  | 'name'
  | 'createdAt'
  | 'updatedAt'
  | 'isActive'
  | 'isDeleted'
  | 'deletedAt'
  | 'isHighlighted'
  | 'category';

type FeatureFilterOptions = {
  locale?: SupportedLocales;
  limit: number;
  skip: number;
  sortBy?: FeatureSortField;
  sortOrder?: 'ASC' | 'DESC';
};

type FeatureFilter = {
  id?: string[];
  slug?: string[];
  search?: string;
  category?: FeatureCategory[];
  isHighlighted?: 'true' | 'false';
};

export interface CarFeatureRepository extends Repository<CarFeature> {
  getFeatures(
    filter?: FeatureFilter,
    options?: FeatureFilterOptions
  ): Promise<[CarFeature[], number]>;

  getFeature(id: string, locale?: SupportedLocales): Promise<CarFeature>;

  getFeatureBySlug(
    slug: string,
    locale?: SupportedLocales
  ): Promise<CarFeature>;
}

export const FeaturesRepositoryToken = new Token<CarFeatureRepository>();

function getFeaturesRepository(dataSource: DataSource) {
  return dataSource.getRepository(CarFeature).extend({
    defaultLocale: 'en',

    getFeatures(
      filter?: FeatureFilter,
      options: FeatureFilterOptions = {
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

      const { slug, search, id, category, isHighlighted } = filter || {};

      const query = this.getFeatureBaseQuery(locale || this.defaultLocale);

      if (slug && slug.length > 0)
        query.andWhere(`feature.slug in (:...slug)`, { slug });

      if (category && category.length > 0)
        query.andWhere(`feature.category in (:...category)`, { category });

      if (
        isHighlighted &&
        (isHighlighted === 'false' || isHighlighted === 'true')
      )
        query.andWhere(`feature.isHighlighted = :highlighted`, {
          highlighted: isHighlighted,
        });

      if (id && id?.length > 0)
        query.andWhere(`feature.id in (:...id)`, { id });

      if (search && search?.length > 0) {
        query.andWhere(
          `EXISTS (
              SELECT 1 FROM car_feature_translation
              WHERE trans.parentId = feature.id
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
        query.orderBy(`feature.${sortBy}`, sortOrder);
      }

      return query
        .groupBy('feature.id, trans.id')
        .skip(skip)
        .take(limit)
        .setParameters({ locale, fallbackLocale: this.defaultLocale })
        .getManyAndCount();
    },

    getFeature(id: string, locale?: SupportedLocales) {
      return this.getFeatureBaseQuery(locale)
        .where('feature.id = :id', { id })
        .getOne();
    },

    getFeatureBySlug(slug: string, locale?: SupportedLocales) {
      return this.getFeatureBaseQuery(locale)
        .where('feature.slug = :slug', { slug })
        .getOne();
    },

    getFeatureBaseQuery(locale?: SupportedLocales) {
      return this.createQueryBuilder('feature').leftJoinAndSelect(
        'feature.translations',
        'trans',
        'trans.locale IN (:...locales)',
        { locales: [locale || this.defaultLocale, this.defaultLocale] }
      );
    },
  });
}

@Service()
export class CarFeatureRepositoryFacrory {
  static create(dataSource: DataSource) {
    return dataSource
      .getRepository(CarFeature)
      .extend(getFeaturesRepository(dataSource));
  }
}
