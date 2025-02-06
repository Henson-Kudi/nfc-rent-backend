import { IMessageBroker, IUseCase } from "@/types/global";
import { LeaveOrganisationsDTO } from "../../domain/dtos";
import { AppError, IReturnValue } from "@/common/utils";
import IOrganisationRepository from "../repositories";
import { DeFaultRoles, ResponseCodes } from "@/common/enums";
import { Collaboration } from "@prisma/client";
import { organisationLeft } from '../../utils/messages.json'

class LeaveOrganisation implements IUseCase<[LeaveOrganisationsDTO], IReturnValue<Collaboration | null>> {
    constructor(private readonly repo: IOrganisationRepository, private readonly messageBroker: IMessageBroker) { }

    async execute(data: LeaveOrganisationsDTO): Promise<IReturnValue<Collaboration | null>> {
        data = new LeaveOrganisationsDTO(data)

        const validData = await data.validate()

        // User cannot leave if they're the only owner of the organisation
        const foundOthers = await this.repo.countCollaborators({
            where: {
                collaboratorId: {
                    not: validData.collaboratorId
                },
                organisationId: validData.id,
                roles: {
                    has: DeFaultRoles.OWNER
                }
            }
        })

        if (!foundOthers || foundOthers < 1) {
            throw new AppError({
                message: 'Organisation must have at least one owner. Please assign a different collaborator as owner',
                statusCode: ResponseCodes.BadRequest
            })
        }

        const deleted = await this.repo.deleteCollaborator({
            where: {
                collaboratorId_organisationId: {
                    collaboratorId: validData.collaboratorId,
                    organisationId: validData.id
                }
            }
        })

        if (deleted) {

            try {
                await this.messageBroker.publishMessage<Collaboration>(organisationLeft, { data: deleted })
            } catch (err) {

            }
        }

        return new IReturnValue({
            success: true,
            message: 'Successfully left organisation',
            data: deleted
        })

    }

}

export default LeaveOrganisation