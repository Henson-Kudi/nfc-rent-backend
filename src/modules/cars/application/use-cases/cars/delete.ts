import { User } from '@/common/entities';
import { IReturnValue } from '@/common/utils';
import logger from '@/common/utils/logger';
import { CarRepository } from '@/modules/cars/infrastrucure/car.repository';
import { FleetEvents } from '@/common/message-broker/events/fleet.events';

export class DeleteCarUseCase
  implements
    IUseCase<[string | string[], User], IReturnValue<{ affected: number }>>
{
  constructor(
    private readonly carRepo: CarRepository,
    private readonly messageBroker: IMessageBroker
  ) {}

  async execute(
    carId: string | string[],
    actor: User,
    hardDelete?: boolean
  ): Promise<IReturnValue<{ affected: number }>> {
    // Ensure existence of car
    let affected = 0;

    if (hardDelete) {
      const res = await this.carRepo.delete(carId);
      affected = res.affected || 0;
      try {
        await this.messageBroker.publishMessage(FleetEvents.car.removed, {
          data: {
            data: {
              affected: res.affected,
              ids: Array.isArray(carId) ? carId : [carId],
            },
            actor,
          },
        });
      } catch (err) {
        logger.error(`Failed to publish ${FleetEvents.car.removed} event`, err);
      }
    } else {
      const updateResult = await this.carRepo.softDelete(carId);

      affected = updateResult?.affected || 0;

      try {
        await this.messageBroker.publishMessage(FleetEvents.car.deleted, {
          data: {
            data: {
              affected: updateResult.affected,
              ids: Array.isArray(carId) ? carId : [carId],
            },
            actor,
          },
        });
      } catch (err) {
        logger.error(`Failed to publish ${FleetEvents.car.deleted} event`, err);
      }
    }

    return new IReturnValue({
      success: true,
      message: ' Car deleted successfully',
      data: { affected },
    });
  }
}
