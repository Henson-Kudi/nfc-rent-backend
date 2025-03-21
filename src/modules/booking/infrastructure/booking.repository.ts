import { Booking } from '@/common/entities';
import { Service, Token } from 'typedi';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';

type GetBookingOptions = {
  locale?: SupportedLocales;
  page?: number;
  limit?: number;
  relations?:
    | {
        payment?: boolean | { addressMap: boolean };
        user?: boolean;
        driver?: boolean;
        car?: boolean;
        selectedAddons?: boolean;
      }
    | ['payment' | 'user' | 'driver' | 'car' | 'payment' | 'selectedAddons'];
};

const generateJoinLookups = (
  query: SelectQueryBuilder<Booking>,
  relations: GetBookingOptions['relations']
) => {
  if (!relations) {
    return query;
  }

  if (Array.isArray(relations)) {
    relations.forEach((relation) => {
      query.leftJoinAndSelect(`booking.${relation}`, relation);
    });
    return query;
  }

  Object.entries(relations).forEach(([key, value]) => {
    if (typeof value === 'boolean' && value) {
      query.leftJoinAndSelect(`booking.${key}`, key);
    } else if (typeof value === 'object') {
      query.leftJoinAndSelect(`booking.${key}`, key);
      Object.keys(value).forEach((nestedKey) => {
        query.leftJoinAndSelect(`${key}.${nestedKey}`, `${key}_${nestedKey}`);
      });
    }
  });

  return query;
};

const generateGroupByFields = (
  relations: GetBookingOptions['relations']
): string[] => {
  const fields = ['booking.id'];

  if (!relations) {
    return fields;
  }

  if (Array.isArray(relations)) {
    relations.forEach((relation) => {
      fields.push(`${relation}.id`);
    });
    return fields;
  }

  Object.entries(relations).forEach(([key, value]) => {
    fields.push(`${key}.id`);
    if (typeof value === 'object') {
      Object.keys(value).forEach((nestedKey) => {
        fields.push(`${key}_${nestedKey}.id`);
      });
    }
  });

  return fields;
};

export interface BookingRepository extends Repository<Booking> {
  getBookings(
    filter?: GetBookingsFilter,
    options?: GetBookingOptions & { limit: number; skip: number }
  ): Promise<[Booking[], number]>;

  getBooking(id: string, options?: GetBookingOptions): Promise<Booking>;

  getCarBookings(
    carId: string,
    options?: GetBookingOptions & { limit: number; skip: number }
  ): Promise<[Booking[], number]>;

  getUserBookings(
    userId: string,
    options?: GetBookingOptions & { limit: number; skip: number }
  ): Promise<[Booking[], number]>;
}

export const BookingsRepositoryToken = new Token<BookingRepository>();

function getBookingsRepository(dataSource: DataSource) {
  return dataSource.getRepository(Booking).extend({
    defaultLocale: 'en',

    getBookings(
      filter?: GetBookingsFilter,
      options: GetBookingOptions & { limit: number; skip: number } = {
        locale: 'en',
        limit: 10,
        skip: 0,
        // sortBy: 'createdAt',
        // sortOrder: 'ASC',
      }
    ) {
      const {
        limit = 10,
        locale = 'en',
        skip = 0,
        // sortBy = 'createdAt',
        // sortOrder = 'ASC',
      } = options;

      // const { slug, search, id } = filter || {};

      const query = this.getBaseQuery(options);

      const groupByFieds = generateGroupByFields(options?.relations);

      return query
        .groupBy(groupByFieds.join(', '))
        .skip(skip)
        .take(limit)
        .setParameters({ locale, fallbackLocale: this.defaultLocale })
        .getManyAndCount();
    },

    getBooking(id: string, options?: GetBookingOptions) {
      return this.getBaseQuery(options)
        .where('booking.id = :id', { id })
        .getOne();
    },

    getCarBookings(
      carId: string,
      options: GetBookingOptions & { limit: number; skip: number } = {
        locale: 'en',
        limit: 10,
        skip: 0,
        // sortBy: 'createdAt',
        // sortOrder: 'ASC',
      }
    ) {
      const {
        limit = 10,
        locale = 'en',
        skip = 0,
        // sortBy = 'createdAt',
        // sortOrder = 'ASC',
      } = options;
      const groupByFieds = generateGroupByFields(options?.relations);
      return this.getBaseQuery(options)
        .groupBy(groupByFieds.join(', '))
        .where('car.id = :carId', { carId })
        .skip(skip)
        .take(limit)
        .setParameters({ locale, fallbackLocale: this.defaultLocale })
        .getManyAndCount();
    },

    getUserBookings(
      userId: string,
      options: GetBookingOptions & { limit: number; skip: number } = {
        locale: 'en',
        limit: 10,
        skip: 0,
        // sortBy: 'createdAt',
        // sortOrder: 'ASC',
      }
    ) {
      const {
        limit = 10,
        locale = 'en',
        skip = 0,
        // sortBy = 'createdAt',
        // sortOrder = 'ASC',
      } = options;

      const groupByFieds = generateGroupByFields(options?.relations);
      return this.getBaseQuery(options)
        .groupBy(groupByFieds.join(', '))
        .where('user.id = :userId', { userId })
        .skip(skip)
        .take(limit)
        .setParameters({ locale, fallbackLocale: this.defaultLocale })
        .getManyAndCount();
    },

    getBaseQuery(options?: GetBookingOptions) {
      const q = this.createQueryBuilder('booking');

      if (options?.relations) {
        generateJoinLookups(q, options.relations);
      }

      return q;
    },
  });
}

@Service()
export class BookingRepositoryFacrory {
  static create(dataSource: DataSource) {
    return dataSource
      .getRepository(Booking)
      .extend(getBookingsRepository(dataSource));
  }
}
