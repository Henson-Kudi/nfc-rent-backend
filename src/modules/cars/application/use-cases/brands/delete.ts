import { User } from '@/common/entities';
import { IReturnValue } from '@/common/utils';
import logger from '@/common/utils/logger';
import { FleetEvents } from '@/common/message-broker/events/fleet.events';
import { CarBrandRepository } from '@/modules/cars/infrastrucure/brand.repository';

export class DeleteCarBrandUseCase
  implements
    IUseCase<[string | string[], User], IReturnValue<{ affected: number }>>
{
  constructor(
    private readonly carBrandRepo: CarBrandRepository,
    private readonly messageBroker: IMessageBroker
  ) {}

  async execute(
    brandId: string | string[],
    actor: User,
    hardDelete?: boolean
  ): Promise<IReturnValue<{ affected: number }>> {
    // Ensure existence of car
    let affected = 0;

    if (hardDelete) {
      const res = await this.carBrandRepo.delete(brandId);
      affected = res.affected || 0;
      try {
        await this.messageBroker.publishMessage(FleetEvents.brand.removed, {
          data: {
            data: {
              affected: res.affected,
              ids: Array.isArray(brandId) ? brandId : [brandId],
            },
            actor,
          },
        });
      } catch (err) {
        logger.error(
          `Failed to publish ${FleetEvents.brand.removed} event`,
          err
        );
      }
    } else {
      const updateResult = await this.carBrandRepo.softDelete(brandId);

      affected = updateResult?.affected || 0;

      try {
        await this.messageBroker.publishMessage(FleetEvents.brand.deleted, {
          data: {
            data: {
              affected: updateResult.affected,
              ids: Array.isArray(brandId) ? brandId : [brandId],
            },
            actor,
          },
        });
      } catch (err) {
        logger.error(
          `Failed to publish ${FleetEvents.brand.deleted} event`,
          err
        );
      }
    }

    return new IReturnValue({
      success: true,
      message: ' Brands deleted successfully',
      data: { affected },
    });
  }
}
