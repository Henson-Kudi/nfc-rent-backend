import { User } from "@/common/entities";
import { IReturnValue } from "@/common/utils";
import logger from "@/common/utils/logger";
import { featuresDeleted, featuresRemoved } from '../../../utils/messages.json'
import { CarFeatureRepository } from "@/modules/cars/infrastrucure/feature.repository";

export class DeleteCarFeatureUseCase implements IUseCase<[string | string[], User], IReturnValue<{ affected: number }>> {

    constructor(
        private readonly carFeatureRepo: CarFeatureRepository,
        private readonly messageBroker: IMessageBroker,
    ) { }


    async execute(featureId: string | string[], actor: User, hardDelete?: boolean): Promise<IReturnValue<{ affected: number }>> {

        // Ensure existence of car
        let affected = 0;

        if (hardDelete) {
            const res = await this.carFeatureRepo.delete(featureId)
            affected = res.affected || 0
            try {
                await this.messageBroker.publishMessage(featuresRemoved, {
                    data: {
                        data: {
                            affected: res.affected,
                            ids: Array.isArray(featureId) ? featureId : [featureId]
                        }, actor
                    }
                })
            } catch (err) {
                logger.error(`Failed to publish ${featuresRemoved} event`, err)
            }
        } else {
            const updateResult = await this.carFeatureRepo.softDelete(featureId)

            affected = updateResult?.affected || 0

            try {
                await this.messageBroker.publishMessage(featuresDeleted, {
                    data: {
                        data: {
                            affected: updateResult.affected,
                            ids: Array.isArray(featureId) ? featureId : [featureId]
                        }, actor
                    }
                })
            } catch (err) {
                logger.error(`Failed to publish ${featuresDeleted} event`, err)
            }
        }


        return new IReturnValue({
            success: true,
            message: 'Features deleted successfully',
            data: { affected }
        })
    }

}