import { ProductBrand } from "@/common/entities";
import { AppError, IReturnValue } from "@/common/utils";
import { Inject, Service } from "typedi";
import { IBrandRepository } from "../../repositories/brand";
import slugify from "@/common/utils/slugify";
import { ResponseCodes } from "@/common/enums";
import { CreateBrandDTO } from "@/modules/cars/domain/dtos/brand";

@Service('products.brands.create.use-case')
export class CreateBrandUseCase implements IUseCase<[CreateBrandDTO], IReturnValue<ProductBrand>> {
    @Inject('brand.repository')
    private brandRepository!: IBrandRepository;

    async execute(data: CreateBrandDTO): Promise<IReturnValue<ProductBrand>> {
        // Validate the data
        const validData = await validateCreateBrand({
            ...data,
            slug: slugify(data.name) // we want the slug to be generated from the name
        });

        // Ensure this brand does not already exist
        const existingBrand = await this.brandRepository.findOne({ where: { slug: validData.slug } });

        if (existingBrand) {
            return new IReturnValue({
                error: new AppError({ message: 'Brand already exists', statusCode: ResponseCodes.BadRequest, data: { slug: validData.slug } }),
                success: false,
                message: 'Brand already exists'
            });
        }

        const brand = this.brandRepository.create(validData);

        await this.brandRepository.save(brand);

        return new IReturnValue({
            success: true,
            message: 'Brand created successfully',
            data: brand
        });
    }
}