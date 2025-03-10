import requestHandler from '@/common/request/adapter';
import { Router } from 'express';
import { GetFeaturesController } from '../controllers/features/get-features.controller';
import { GetFeatureController } from '../controllers/features/get-feature.controller';
import { CreateFeaturesController } from '../controllers/features/creat-feature.controller';
import { DeleteCarFeaturesController } from '../controllers/features/delete-features.controller';
import { UpdateCarFeatureController } from '../controllers/features/update-feature.controller';
import { DeleteCarFeatureController } from '../controllers/features/delete-feature.controller';
import { ValidateFeatureNameController } from '../controllers/features/validate-name.controller';

const featuresRouter = Router();

featuresRouter.route('/').get(requestHandler(new GetFeaturesController())).post(requestHandler(new CreateFeaturesController())).delete(requestHandler(new DeleteCarFeaturesController()));

featuresRouter.get('/validate-name', requestHandler(new ValidateFeatureNameController()))

featuresRouter.route('/:id').get(requestHandler(new GetFeatureController())).put(requestHandler(new UpdateCarFeatureController())).delete(requestHandler(new DeleteCarFeatureController()));

export default featuresRouter;
