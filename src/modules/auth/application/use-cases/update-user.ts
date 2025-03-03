import { AppError, IReturnValue } from "@/common/utils";
import { UserRepository } from "../../infrastructure/repositories/user.repository";
import { userProfileUpdated } from '../../utils/messageTopics.json'
import logger from "@/common/utils/logger";
import { User } from "@/common/entities";
import { UpdateUserDTO } from "../../domain/dtos/user";
import { ResponseCodes } from "@/common/enums";

export class UpdateUserUseCase implements IUseCase<[string, UpdateUserData], IReturnValue<{ id: string, updated: UpdateUserData }>> {
    constructor(private readonly repo: UserRepository, private readonly messageBroker: IMessageBroker) { }

    async execute(userId: string, data: UpdateUserData): Promise<IReturnValue<{ id: string, updated: UpdateUserData }>> {
        const validData = await (new UpdateUserDTO(data)).validate()

        if (validData.fullName && validData.fullName.length < 2) {
            throw new AppError({
                statusCode: ResponseCodes.ValidationError,
                message: "Full name cannot be less than 2 characters."
            })
        }

        await this.repo.update(userId, validData)

        try {
            this.messageBroker.publishMessage(userProfileUpdated, { data: { id: userId, updated: validData } })
        } catch (error) {
            logger.error(`Failed to publish ${userProfileUpdated} event`, error)
        }

        return new IReturnValue({
            success: true,
            data: {
                id: userId,
                updated: validData
            },
            message: 'Profile updated successfully'
        })

    }
}