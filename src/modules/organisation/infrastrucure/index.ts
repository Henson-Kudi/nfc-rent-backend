import { Prisma, Organisation, Collaboration, PrismaClient, OrganisationModule } from "@prisma/client";
import IOrganisationRepository from "../application/repositories";
import { getDefaultPrismaClient } from "@/common/database";

export class OrganisationRepository implements IOrganisationRepository {
    private readonly dataSource: PrismaClient
    constructor() {
        this.dataSource = getDefaultPrismaClient()
    }

    createOrganisation(data: Prisma.OrganisationCreateArgs): Promise<Organisation> {
        return this.dataSource.organisation.create(data)
    }

    updateorganisation(data: Prisma.OrganisationUpdateArgs): Promise<Organisation | null> {
        return this.dataSource.organisation.update(data)
    }

    createorganisationModule(data: Prisma.OrganisationModuleCreateArgs): Promise<OrganisationModule | null> {
        return this.dataSource.organisationModule.create(data)
    }
    createorganisationModules(data: Prisma.OrganisationModuleCreateManyArgs): Promise<Prisma.BatchPayload> {
        return this.dataSource.organisationModule.createMany(data)
    }

    updateorganisationModule(data: Prisma.OrganisationModuleUpdateArgs): Promise<OrganisationModule | null> {
        return this.dataSource.organisationModule.update(data)
    }

    findOrganisation(query: Prisma.OrganisationFindUniqueArgs): Promise<Organisation | null> {
        return this.dataSource.organisation.findUnique(query)
    }

    findOrganisations(query: Prisma.OrganisationFindManyArgs): Promise<Organisation[]> {
        return this.dataSource.organisation.findMany(query)
    }

    deleteOrganisations(query: Prisma.OrganisationDeleteManyArgs): Promise<Prisma.BatchPayload> {
        return this.dataSource.organisation.deleteMany(query)
    }

    count(query: Prisma.OrganisationCountArgs): Promise<number> {
        return this.dataSource.organisation.count(query)
    }

    addCollaborator(data: Prisma.CollaborationCreateArgs): Promise<Collaboration> {
        return this.dataSource.collaboration.create(data)
    }

    updateCollaborator(data: Prisma.CollaborationUpdateArgs): Promise<Collaboration | null> {
        return this.dataSource.collaboration.update(data)
    }

    deleteCollaborator(query: Prisma.CollaborationDeleteArgs): Promise<Collaboration | null> {
        return this.dataSource.collaboration.delete(query)
    }

    deleteCollaborators(query: Prisma.CollaborationDeleteManyArgs): Promise<Prisma.BatchPayload> {
        return this.dataSource.collaboration.deleteMany(query)
    }

    findCollaborator(query: Prisma.CollaborationFindUniqueArgs): Promise<Collaboration | null> {
        return this.dataSource.collaboration.findUnique(query)
    }

    findCollaborators(query: Prisma.CollaborationFindManyArgs): Promise<Collaboration[]> {
        return this.dataSource.collaboration.findMany(query)
    }

    countCollaborators(query: Prisma.CollaborationCountArgs): Promise<number> {
        return this.dataSource.collaboration.count(query)
    }

}