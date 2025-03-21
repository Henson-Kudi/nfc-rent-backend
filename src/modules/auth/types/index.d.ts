import { User } from '@/common/entities';
import { OTPVERIFICATIONTYPES } from '../domain/enums';

export type UserWithVerificationType = User & {
  verificationType: OTPVERIFICATIONTYPES;
};
