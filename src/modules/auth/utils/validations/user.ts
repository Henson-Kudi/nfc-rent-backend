import Joi from 'joi';

const UpdateUserSchema = Joi.object<UpdateUserData>({
  fullName: Joi.string().optional(),
  photo: Joi.string().optional().allow(null).allow(''),
}).unknown();

export { UpdateUserSchema };
