import { IReturnValue } from "@/common/utils";
import { IMessageBroker, IUseCase } from "@/types/global";
import { LogoutDTO } from "../../domain/dtos";
import IAuthUserRepository from "../repositories/auth";
import logger from "@/common/utils/logger";
import { loggedOut } from '../../utils/messageTopics.json'

class Logout implements IUseCase<[LogoutDTO], IReturnValue<{ success: boolean }>> {
    constructor(private readonly repo: IAuthUserRepository, private readonly messageBroker: IMessageBroker) { }

    async execute(data: LogoutDTO): Promise<IReturnValue<{ success: boolean; }>> {
        try {
            const validData = await new LogoutDTO(data).validate()

            // Delete this session from db so that user would need to verify otp again in case they want to login with same device
            await this.repo.deleteSessions({
                where: {
                    userId: validData.userId,
                    device: validData.deviceName
                }
            })

            await this.messageBroker.publishMessage(loggedOut, { data: validData })

        } catch (err) {
            logger.error((err as Error)?.message, err)
        }

        return new IReturnValue({
            success: true,
            data: {
                success: true,

            },
            message: "Logged out from session successfully"
        })
    }

}

export default Logout