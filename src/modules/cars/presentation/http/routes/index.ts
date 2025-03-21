import { Router } from 'express';
import brandsRouter from './brands.router';
import modelsRouter from './models.router';
import featuresRouter from './features.router';
import requestHandler from '@/common/request/adapter';
import { CreateCarsController } from '../controllers/cars/creat-car.controller';
import { GetCarsController } from '../controllers/cars/get-cars.controller';
import { GetCarController } from '../controllers/cars/get-car.controller';
import { UpdateCarController } from '../controllers/cars/update-car.controller';
import { DeleteCarController } from '../controllers/cars/delete-car.controller';
import { DeleteCarsController } from '../controllers/cars/delete-cars.controller';
import { ValidateCarNameController } from '../controllers/cars/validate-name.controller';

const carsRouter = Router();

carsRouter.use('/brands', brandsRouter);
carsRouter.use('/models', modelsRouter);
carsRouter.use('/features', featuresRouter);

carsRouter
  .route('/')
  .post(requestHandler(new CreateCarsController()))
  .get(requestHandler(new GetCarsController()))
  .delete(requestHandler(new DeleteCarsController()));

carsRouter.get(
  '/validate-name',
  requestHandler(new ValidateCarNameController())
);

carsRouter
  .route('/:id')
  .get(requestHandler(new GetCarController()))
  .put(requestHandler(new UpdateCarController()))
  .delete(requestHandler(new DeleteCarController()));

export default carsRouter;
