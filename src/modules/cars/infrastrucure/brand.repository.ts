import { CarBrand } from "@/common/entities";
import slugify from "@/common/utils/slugify";
import { Service } from "typedi";
import { Repository } from "typeorm";

type SortField = 'name' | 'createdAt' | 'updatedAt' | 'isActive' | 'isDeleted' | 'deletedAt'

type FilterOptions = {
    locale?: SupportedLocales,
    limit?: number
    skip?: number
    sortBy?: SortField,
    sortOrder?: 'ASC' | 'DESC'
}

type BrandFilter = {
    id?: string[],
    slug?: string,
    search?: string
}

@Service()
export class CarBrandRepository extends Repository<CarBrand> {
    private readonly defaultLocale: SupportedLocales = 'en'

    getBrands(filter?: BrandFilter, options: FilterOptions = {
        locale: 'en', limit: 10, skip: 0, sortBy: 'createdAt',
        sortOrder: 'ASC'
    }) {
        const { limit = 10, locale = 'en', skip = 0, sortBy = 'createdAt', sortOrder = 'ASC' } = options

        const { slug, search, id } = filter || {}

        const query = this.getBrandBaseQuery(locale || this.defaultLocale);

        if (slug && slug.length > 0) query.andWhere(`brand.slug ILIKE :slug`, { slug: `%${slugify(slug)}%` })

        if (id && id?.length > 0) query.andWhere(`brand.id in (:...id)`, { id })

        if (search && search?.length > 0) {
            query.andWhere(`EXISTS (
              SELECT 1 FROM car_brand_translation
              WHERE trans.parentId = brand.id
              AND name ILIKE :searchTerm
            )`, { searchTerm: `%${search}%` });
        }

        if (sortBy === 'name') {
            query
                .addSelect(`
                  CASE
                    WHEN trans.locale = :locale THEN 1
                    WHEN trans.locale = :fallbackLocale THEN 2
                    ELSE 3
                  END AS trans_priority`
                )
                .orderBy('MIN(trans.name)', sortOrder)
                .addOrderBy('trans_priority', 'ASC');
        } else {
            query.orderBy(`brand.${sortBy}`, sortOrder);
        }

        return query
            .groupBy('brand.id, trans.id')
            .skip(skip)
            .take(limit)
            .setParameters({ locale, fallbackLocale: this.defaultLocale })
            .getManyAndCount();
    }

    getBrand(id: string, locale?: SupportedLocales) {
        return this.getBrandBaseQuery(locale)
            .where('brand.id = :id', { id })
            .getOne();
    }

    getBrandBySlug(slug: string, locale?: SupportedLocales) {
        return this.getBrandBaseQuery(locale)
            .where('brand.slug = :slug', { slug })
            .getOne();
    }

    private getBrandBaseQuery(locale?: SupportedLocales) {
        return this.createQueryBuilder('brand')
            .leftJoinAndSelect(
                'brand.translations',
                'trans',
                'trans.locale IN (:...locales)',
                { locales: [locale || this.defaultLocale, this.defaultLocale] }
            )
    }
}