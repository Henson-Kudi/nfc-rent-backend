import { getDefaultPrismaClient } from '@/common/database';
import IOTPRepository from '../../application/repositories/otp-repository';
import { Prisma, OTP } from '@prisma/client';

class OTPRepository implements IOTPRepository {
  private readonly db = getDefaultPrismaClient();

  create(data: Prisma.OTPCreateArgs): Promise<OTP> {
    return this.db.oTP.create(data);
  }
}

const oTPRepository = new OTPRepository();

export default oTPRepository;
