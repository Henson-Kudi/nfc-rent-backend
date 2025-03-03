import { ProductBrand } from "@/common/entities";
import { IReturnValue } from "@/common/utils";
import { Inject, Service } from "typedi";
import { IBrandRepository } from "../../repositories/brand";
import { UpdateBrandDTO } from "@/modules/cars/domain/dtos/brand";

@Service('products.brands.update.use-case')
export class UpdateBrandUseCase implements IUseCase<[string, UpdateBrandDTO], IReturnValue<ProductBrand>> {
    @Inject('brand.repository')
    private brandRepository!: IBrandRepository;

    @Inject('global.message-bus')
    private messageBus!: IMessageBroker;
    async execute(id: string, data: UpdateBrandDTO): Promise<IReturnValue<ProductBrand>> {
        throw new Error("Method not implemented.");
    }
} 