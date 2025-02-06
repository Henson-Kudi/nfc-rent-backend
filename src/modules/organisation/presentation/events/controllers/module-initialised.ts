import { AppError } from "@/common/utils";
import logger from "@/common/utils/logger";
import slugify from "@/common/utils/slugify";
import { OrganisationRepository } from "@/modules/organisation/infrastrucure";
import { MessageHandler } from "@/types/global";
import { Organisation, OrganisationModule, OrganisationModuleState, OrganisationState } from "@prisma/client";

const handleModuleInitialised: MessageHandler = async (msg, channel) => {
    try {
        const data = JSON.parse(msg)?.data as Record<'organisationId' | 'name' | 'nameSlug' | 'state', string>
        console.log(data, 'module data')

        if (!data.name || !data.organisationId || !data.state || !['SUCCESS', 'FAILED'].includes(data.state)) {
            throw new AppError({
                message: 'Invalid module details',
                statusCode: 400
            })
        }

        data.nameSlug = slugify(data.name)

        const repo = new OrganisationRepository()

        const org = await repo.updateorganisationModule({
            where: {
                organisationId_nameSlug: {
                    nameSlug: slugify(data.name),
                    organisationId: data.organisationId
                }
            },
            data: {
                state: data.state as OrganisationModuleState
            },
            include: {
                organisation: {
                    include: { modules: true }
                }
            }
        }) as (OrganisationModule & {
            organisation: Organisation & { modules: OrganisationModule[] }
        }) | null

        if (!org) {
            throw new AppError({
                message: `Invalid module for organisation: ${data.name}`,
                statusCode: 400
            })
        }

        // if there are no modules with pending state, update organisation status to initialised. Here we would also need to emit socket event to frontend so it can automatically refresh the organisation and load data
        if (!org.organisation?.modules?.find(item => item?.state === OrganisationModuleState.PENDING)) {
            await repo.updateorganisation({
                where: { id: org.organisationId },
                data: { state: OrganisationState.DB_INITIALISED }
            })

            logger.info('Organisation status updated...')
            // Emit socket event.
        }

        console.log(JSON.stringify(org))

    } catch (err) {
        logger.error((err as Error)?.message, err)
    }
}

export default handleModuleInitialised