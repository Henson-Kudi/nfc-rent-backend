import requestHandler from "@/common/request/adapter";
import { Router } from "express";
import CreateOrganisation from "../controllers/create-organisation";
import ChangeCollaboratorRoles from "../controllers/change-collaborator-roles";
import UpdateOrganisation from "../controllers/update-organisation";
import DeleteOrganisations from "../controllers/delete-organisations";
import GetCollaborations from "../controllers/get-collaborations";
import LeaveOrganisation from "../controllers/leave-organisation";
import RemoveCollaborators from "../controllers/remove-collaborators";
import authenticateRequest from "@/common/middleware/authenticate-request";

const router = Router()

router.use(authenticateRequest())

router.route('/').post(requestHandler(new CreateOrganisation())).put(requestHandler(new UpdateOrganisation())).delete(requestHandler(new DeleteOrganisations())).get(requestHandler(new GetCollaborations()))

router.post('/change-collaborator-roles', requestHandler(new ChangeCollaboratorRoles()))

router.post('/leave-organisation', requestHandler(new LeaveOrganisation()))
router.post('/remove-collaborators', requestHandler(new RemoveCollaborators()))




export default router;