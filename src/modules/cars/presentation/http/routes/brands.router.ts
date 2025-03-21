import requestHandler from '@/common/request/adapter';
import { Router } from 'express';
import { GetBrandsController } from '../controllers/brands/get-brands.controller';
import { GetBrandController } from '../controllers/brands/get-brand.controller';
import { CreateBrandsController } from '../controllers/brands/creat-brand.controller';
import { DeleteCarBrandsController } from '../controllers/brands/delete-brands.controller';
import { UpdateCarBrandsController } from '../controllers/brands/update-brands.controller';
import { DeleteCarBrandController } from '../controllers/brands/delete-brand.controller';
import { ValidateBrandNameController } from '../controllers/brands/validate-brand-name.controller';

const brandsRouter = Router();

brandsRouter
  .route('/')
  .get(requestHandler(new GetBrandsController()))
  .post(requestHandler(new CreateBrandsController()))
  .delete(requestHandler(new DeleteCarBrandsController()));

brandsRouter.get(
  '/validate-name',
  requestHandler(new ValidateBrandNameController())
);

brandsRouter
  .route('/:id')
  .get(requestHandler(new GetBrandController()))
  .put(requestHandler(new UpdateCarBrandsController()))
  .delete(requestHandler(new DeleteCarBrandController()));

export default brandsRouter;
