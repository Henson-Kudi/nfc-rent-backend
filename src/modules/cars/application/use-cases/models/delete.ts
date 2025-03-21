import { User } from '@/common/entities';
import { IReturnValue } from '@/common/utils';
import logger from '@/common/utils/logger';
import { FleetEvents } from '@/common/message-broker/events/fleet.events';
import { CarModelRepository } from '@/modules/cars/infrastrucure/model.repository';

export class DeleteCarModelUseCase
  implements
    IUseCase<[string | string[], User], IReturnValue<{ affected: number }>>
{
  constructor(
    private readonly carModelRepo: CarModelRepository,
    private readonly messageBroker: IMessageBroker
  ) {}

  async execute(
    modelId: string | string[],
    actor: User,
    hardDelete?: boolean
  ): Promise<IReturnValue<{ affected: number }>> {
    // Ensure existence of car
    let affected = 0;

    if (hardDelete) {
      const res = await this.carModelRepo.delete(modelId);
      affected = res.affected || 0;
      try {
        await this.messageBroker.publishMessage(FleetEvents.model.removed, {
          data: {
            data: {
              affected: res.affected,
              ids: Array.isArray(modelId) ? modelId : [modelId],
            },
            actor,
          },
        });
      } catch (err) {
        logger.error(
          `Failed to publish ${FleetEvents.model.removed} event`,
          err
        );
      }
    } else {
      const updateResult = await this.carModelRepo.softDelete(modelId);

      affected = updateResult?.affected || 0;

      try {
        await this.messageBroker.publishMessage(FleetEvents.model.deleted, {
          data: {
            data: {
              affected: updateResult.affected,
              ids: Array.isArray(modelId) ? modelId : [modelId],
            },
            actor,
          },
        });
      } catch (err) {
        logger.error(
          `Failed to publish ${FleetEvents.model.deleted} event`,
          err
        );
      }
    }

    return new IReturnValue({
      success: true,
      message: 'Models deleted successfully',
      data: { affected },
    });
  }
}
