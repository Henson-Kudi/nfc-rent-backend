import requestHandler from '@/common/request/adapter';
import { Router } from 'express';
import { GetModelsController } from '../controllers/models/get-models.controller';
import { CreateModelsController } from '../controllers/models/creat-model.controller';
import { GetModelController } from '../controllers/models/get-model.controller';
import { DeleteCarModelsController } from '../controllers/models/delete-models.controller';
import { UpdateCarModelController } from '../controllers/models/update-model.controller';
import { DeleteCarModelController } from '../controllers/models/delete-model.controller';
import { ValidateModelNameController } from '../controllers/models/validate-name.controller';


const modelsRouter = Router();

modelsRouter.route('/').get(requestHandler(new GetModelsController())).post(requestHandler(new CreateModelsController())).delete(requestHandler(new DeleteCarModelsController()));

modelsRouter.get('/validate-name', requestHandler(new ValidateModelNameController()))

modelsRouter.route('/:id').get(requestHandler(new GetModelController())).put(requestHandler(new UpdateCarModelController())).delete(requestHandler(new DeleteCarModelController()));

export default modelsRouter;
