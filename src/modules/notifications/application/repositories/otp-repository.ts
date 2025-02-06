import { OTP, Prisma } from '@prisma/client';

export default interface IOTPRepository {
  create(data: Prisma.OTPCreateArgs): Promise<OTP>;
}
