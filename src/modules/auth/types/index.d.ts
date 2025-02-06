import { User } from '@prisma/client';

export type UserWithVerificationType = User & {
  verificationType: OTPVERIFICATIONTYPES;
};
