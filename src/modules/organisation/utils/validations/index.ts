import Joi from "joi";

export type CreateOrganisationSchema = {
    name: string
    ownerId: string
    collaborators?: {
        email?: string
        phone?: string
        roles?: string[]
    }[] //string of email ids not user ids. since it can be a registered or unregistered user
    nameSlug: string
}

export type UpdateOrganisationSchema = {
    name: string
    id: string
    ownerId: string
}

export type DeleteOrganisationSchema = {
    ids: string[]
    ownerId: string
}

export type LeaveOrganisationSchema = {
    id: string
    collaboratorId: string
}

export type RemoveCollaboratorsSchema = {
    ownerId: string,
    organisationId: string
    collaborators: string[]
}

export type ChangeCollaboratorRolesSchema = {
    ownerId: string,
    organisationId: string
    collaboratorId: string
    newRoles: string[]
}

export const CreateOrganisationSchema = Joi.object<CreateOrganisationSchema>({
    collaborators: Joi.array().items(Joi.object({
        email: Joi.string().email(),
        phone: Joi.string(),
        roles: Joi.array().items(Joi.string()).optional().allow(null)
    }).or('email', 'phone')).min(0).allow(null),
    name: Joi.string().required().min(2),
    ownerId: Joi.string().required(),
    nameSlug: Joi.string().required()
}).unknown() // this allows for passing of extra fields

export const UpdateOrganisationSchema = Joi.object<UpdateOrganisationSchema>({
    name: Joi.string().required().min(2),
    id: Joi.string().required().min(2),
    ownerId: Joi.string().required().min(2)
}).unknown()

export const DeleteOrganisationSchema = Joi.object<DeleteOrganisationSchema>({
    ids: Joi.array().items(Joi.string().required().min(2)).required().min(1),
    ownerId: Joi.string().required().min(2)
}).unknown()

export const LeaveOrganisationSchema = Joi.object<LeaveOrganisationSchema>({
    id: Joi.string().required().min(2),
    collaboratorId: Joi.string().required().min(2)
}).unknown()

export const RemoveCollaboratorsSchema = Joi.object<RemoveCollaboratorsSchema>({
    ownerId: Joi.string().required().min(2),
    collaborators: Joi.array().items(Joi.string().required().min(2)).required().min(1),
    organisationId: Joi.string().required().min(2)
}).unknown()

export const ChangeCollaboratorRolesSchema = Joi.object<ChangeCollaboratorRolesSchema>({
    ownerId: Joi.string().required().min(2),
    newRoles: Joi.array().items(Joi.string().required().min(2)).required(),
    organisationId: Joi.string().required().min(2),
    collaboratorId: Joi.string().required().min(2)
}).unknown()