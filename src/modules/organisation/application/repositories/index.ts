import { Prisma, Organisation, Collaboration, OrganisationModule } from "@prisma/client";

export default interface IOrganisationRepository {

    createOrganisation(data: Prisma.OrganisationCreateArgs): Promise<Organisation>

    updateorganisation(data: Prisma.OrganisationUpdateArgs): Promise<Organisation | null>

    createorganisationModule(data: Prisma.OrganisationModuleCreateArgs): Promise<OrganisationModule | null>

    createorganisationModules(data: Prisma.OrganisationModuleCreateManyArgs): Promise<Prisma.BatchPayload>

    updateorganisationModule(data: Prisma.OrganisationModuleUpdateArgs): Promise<OrganisationModule | null>

    findOrganisation(query: Prisma.OrganisationFindUniqueArgs): Promise<Organisation | null>

    findOrganisations(query: Prisma.OrganisationFindManyArgs): Promise<Organisation[]>

    deleteOrganisations(query: Prisma.OrganisationDeleteManyArgs): Promise<Prisma.BatchPayload>

    count(query: Prisma.OrganisationCountArgs): Promise<number>

    addCollaborator(data: Prisma.CollaborationCreateArgs): Promise<Collaboration>

    updateCollaborator(data: Prisma.CollaborationUpdateArgs): Promise<Collaboration | null>

    deleteCollaborator(query: Prisma.CollaborationDeleteArgs): Promise<Collaboration | null>

    deleteCollaborators(query: Prisma.CollaborationDeleteManyArgs): Promise<Prisma.BatchPayload>

    findCollaborator(query: Prisma.CollaborationFindUniqueArgs): Promise<Collaboration | null>

    findCollaborators(query: Prisma.CollaborationFindManyArgs): Promise<Collaboration[]>

    countCollaborators(query: Prisma.CollaborationCountArgs): Promise<number>

}