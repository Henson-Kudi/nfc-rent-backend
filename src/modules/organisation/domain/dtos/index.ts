import { AppError } from "@/common/utils"
import { ChangeCollaboratorRolesSchema, CreateOrganisationSchema, DeleteOrganisationSchema, LeaveOrganisationSchema, RemoveCollaboratorsSchema, UpdateOrganisationSchema } from "../../utils/validations"
import { ResponseCodes } from "@/common/enums"
import slugify from "@/common/utils/slugify"

export class InviteCollaboratorDTO{
    email?: string
    phone?: string
    roles?: string[]
}

export class CreateOrganisationDTO {
    name: string
    nameSlug: string
    ownerId: string
    collaborators?: InviteCollaboratorDTO[] //string of email ids not user ids. since it can be a registered or unregistered user

    constructor(data: Omit<CreateOrganisationDTO, 'validate' | 'nameSlug'>) {
        this.name = data.name
        this.ownerId = data.ownerId
        this.collaborators = data.collaborators || []
        this.nameSlug = slugify(data.name)
    }

    validate() {
        return CreateOrganisationSchema.validateAsync(this)
    }
}

export class UpdateOrganisationDTO {
    name: string
    id: string
    ownerId: string

    constructor(data: Omit<UpdateOrganisationDTO, 'validate'>) {
        this.name = data.name
        this.id = data.id
        this.ownerId = data.ownerId
    }

    validate() {
        return UpdateOrganisationSchema.validateAsync(this)
    }
}

export class DeleteOrganisationsDTO {
    ids: string[]
    ownerId: string

    constructor(data: Omit<DeleteOrganisationsDTO, 'validate'>) {
        this.ids = data.ids
        this.ownerId = data.ownerId
    }

    validate() {
        return DeleteOrganisationSchema.validateAsync(this)
    }
}

export class LeaveOrganisationsDTO {
    id: string
    collaboratorId: string

    constructor(data: Omit<LeaveOrganisationsDTO, 'validate'>) {
        this.id = data.id
        this.collaboratorId = data.collaboratorId
    }

    validate() {
        return LeaveOrganisationSchema.validateAsync(this)
    }
}

export class RemoveCollaboratorsDTO {
    ownerId: string
    organisationId: string
    collaborators: string[]

    constructor(data: Omit<RemoveCollaboratorsDTO, 'validate'>) {
        this.ownerId = data.ownerId
        this.organisationId = data.organisationId
        this.collaborators = data.collaborators
    }

    validate() {
        return RemoveCollaboratorsSchema.validateAsync(this)
    }
}

export class ChangeCollaboratorRolesDTO {
    ownerId: string
    organisationId: string
    collaboratorId: string
    newRoles: string[]

    constructor(data: Omit<ChangeCollaboratorRolesDTO, 'validate'>) {
        this.ownerId = data.ownerId
        this.organisationId = data.organisationId
        this.collaboratorId = data.collaboratorId
        this.newRoles = data.newRoles
    }

    validate() {
        return ChangeCollaboratorRolesSchema.validateAsync(this)
    }
}

export class GetCollabrationsQueryDTO {
    collaboratorId: string
    search?: string

    constructor(data: Omit<GetCollabrationsQueryDTO, 'validate'>) {
        this.collaboratorId = data?.collaboratorId || ''
        this.search = data?.search
    }

    validate() {
        return new Promise<GetCollabrationsQueryDTO>((res, rej) => {
            if (!this?.collaboratorId?.length) {
                rej(new AppError({ statusCode: ResponseCodes.BadRequest, message: "Collaborator id is required" }))
            } else {
                res(this)
            }
        })
    }
}