import messageBroker from "@/common/message-broker"
import { OrganisationRepository } from "../../infrastrucure"
import ChangeCollaboratorRoles from "../use-cases/change-collaboratorRoles"
import CreateOrganisation from "../use-cases/creat-organisation"
import DeleteOrganisations from "../use-cases/delete-organisations"
import GetCollabrations from "../use-cases/get-collaborations"
import LeaveOrganisation from "../use-cases/leave-organisation"
import RemoveCollaborators from "../use-cases/remove-collaborators"
import UpdateOrganisation from "../use-cases/update-organisation"

class OrganisationService {
    private readonly messenger = messageBroker
    private readonly repo = new OrganisationRepository()
    constructor() {
        this.changeCollaboratorRoles = new ChangeCollaboratorRoles(this.repo, this.messenger)
        this.createOrganisation = new CreateOrganisation(this.repo, this.messenger)
        this.deleteOrganisations = new DeleteOrganisations(this.repo, this.messenger)
        this.getCollabrations = new GetCollabrations(this.repo)
        this.leaveOrganisation = new LeaveOrganisation(this.repo, this.messenger)
        this.removeCollaborators = new RemoveCollaborators(this.repo, this.messenger)
        this.updateOrganisation = new UpdateOrganisation(this.repo, this.messenger)
    }

    changeCollaboratorRoles: ChangeCollaboratorRoles
    createOrganisation: CreateOrganisation
    deleteOrganisations: DeleteOrganisations
    getCollabrations: GetCollabrations
    leaveOrganisation: LeaveOrganisation
    removeCollaborators: RemoveCollaborators
    updateOrganisation: UpdateOrganisation
}

const organisatinService = new OrganisationService()

export default organisatinService