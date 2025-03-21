import { Car } from '@/common/entities';
import slugify from '@/common/utils/slugify';
import { Service, Token } from 'typedi';
import { DataSource, Repository } from 'typeorm';

export interface CarRepository extends Repository<Car> {
  getCars(
    filter?: CarFilter,
    options?: CarFilterOptions
  ): Promise<[Car[], number]>;

  getCar(id: string, options?: Partial<CarFilterOptions>): Promise<Car>;

  getCarBySlug(slug: string, options?: Partial<CarFilterOptions>): Promise<Car>;
}

export const CarsRepositoryToken = new Token<CarRepository>();

function getCarsRepository(dataSource: DataSource) {
  return dataSource.getRepository(Car).extend({
    defaultLocale: 'en',

    getCars(
      filter?: CarFilter,
      options: CarFilterOptions = {
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

      const query = this.getCarBaseQuery(options);

      if (slug && slug.length > 0)
        query.andWhere(`car.slug in (:...slug)`, { slug });

      if (id && id?.length > 0) query.andWhere(`car.id in (:...id)`, { id });

      if (search && search?.length > 0) {
        query.andWhere(
          `EXISTS (
              SELECT 1 FROM car_translation
              WHERE trans.parentId = car.id
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
        query.orderBy(`car.${sortBy}`, sortOrder);
      }

      let groupByString =
        'car.id, trans.id, brand.id, model.id, brandtrans.id, modeltrans.id, features.id, featurestrans.id, media.id, rentalpricing.id';

      if (options?.withDocuments) groupByString += ', documents.id';
      if (options?.withHistory) groupByString += ', history.id';
      if (options?.withOwnerDetails) groupByString += ', ownershipdetails.id';
      if (options?.withAddons) groupByString += ', availableaddons.id';

      return query
        .groupBy(groupByString)
        .skip(skip)
        .take(limit)
        .setParameters({ locale, fallbackLocale: this.defaultLocale })
        .getManyAndCount();
    },

    getCar(id: string, options?: CarFilterOptions) {
      return this.getCarBaseQuery(options)
        .where('car.id = :id', { id })
        .getOne();
    },

    getCarBySlug(slug: string, options?: CarFilterOptions) {
      return this.getCarBaseQuery(options)
        .where('car.slug = :slug', { slug: slugify(slug) }) // for safety,slugify the slug again
        .getOne();
    },

    getCarBaseQuery(options?: CarFilterOptions) {
      const q = this.createQueryBuilder('car')
        .leftJoinAndSelect(
          'car.translations',
          'trans',
          'trans.locale IN (:...locales)',
          { locales: [options?.locale || this.defaultLocale] }
        )
        // Lookup brand
        .leftJoinAndSelect('car.brand', 'brand')
        .leftJoinAndSelect(
          'brand.translations',
          'brandtrans',
          'brandtrans.locale = :locale',
          { locale: options?.locale || this.defaultLocale }
        )
        // Lookup model
        .leftJoinAndSelect('car.model', 'model')
        .leftJoinAndSelect(
          'model.translations',
          'modeltrans',
          'modeltrans.locale = :locale',
          { locale: options?.locale || this.defaultLocale }
        )
        // Lookup features
        .leftJoinAndSelect('car.features', 'features')
        .leftJoinAndSelect(
          'features.translations',
          'featurestrans',
          'featurestrans.locale = :locale',
          { locale: options?.locale || this.defaultLocale }
        )
        // lookup media
        .leftJoinAndSelect('car.media', 'media')
        // lookup pricing
        .leftJoinAndSelect('car.rentalPricings', 'rentalpricing');

      if (options?.withDocuments)
        q.leftJoinAndSelect('car.documents', 'documents');
      if (options?.withOwnerDetails)
        q.leftJoinAndSelect('car.ownershipDetails', 'ownershipdetails');
      if (options?.withHistory) q.leftJoinAndSelect('car.history', 'history');
      if (options?.withAddons)
        q.leftJoinAndSelect('car.availableAddons', 'availableaddons');

      return q;
    },
  });
}

@Service()
export class CarRepositoryFacrory {
  static create(dataSource: DataSource) {
    return dataSource.getRepository(Car).extend(getCarsRepository(dataSource));
  }
}
