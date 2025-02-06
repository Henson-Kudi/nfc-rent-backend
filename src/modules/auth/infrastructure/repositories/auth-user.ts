import { OTP, Prisma, PrismaClient, Session, User } from '@prisma/client';
import { getDefaultPrismaClient } from '@/common/database';
import IAuthUserRepository from '@/modules/auth/application/repositories/auth';

class AuthUserRpository implements IAuthUserRepository {
  private db: PrismaClient;
  constructor() {
    this.db = getDefaultPrismaClient();
  }

  findOne(params: Prisma.UserFindUniqueArgs): Promise<User | null> {
    return this.db.user.findUnique(params);
  }

  findByEmail(email: string, options?: {
    include?: Prisma.UserInclude,
    select?: Prisma.UserSelect
  }): Promise<User | null> {
    return this.db.user.findUnique({ where: { email }, include: options?.include });
  }

  findByPhone(phone: string, options?: {
    include?: Prisma.UserInclude,
    select?: Prisma.UserSelect
  }): Promise<User | null> {
    return this.db.user.findUnique({ where: { phone }, include: options?.include });
  }

  findById(id: string, options?: {
    include?: Prisma.UserInclude,
    select?: Prisma.UserSelect
  }): Promise<User | null> {
    return this.db.user.findUnique({ where: { id }, include: options?.include });
  }

  findByEmailOrPhone(email: string, phone: string, options?: {
    include?: Prisma.UserInclude,
    select?: Prisma.UserSelect
  }): Promise<User | null> {
    return this.db.user.findUnique({
      where: email && phone ? { email, phone } : email ? { email } : { phone },
      include: options?.include
    });
  }

  createUser(data: Prisma.UserCreateArgs): Promise<User | null> {
    return this.db.user.create(data);
  }

  updateUser(data: Prisma.UserUpdateArgs): Promise<User | null> {
    return this.db.user.update(data);
  }

  findUserSession(
    params: Prisma.SessionFindUniqueArgs
  ): Promise<Session | null> {
    return this.db.session.findUnique(params);
  }

  findUserSessions(params: Prisma.SessionFindManyArgs): Promise<Session[]> {
    return this.db.session.findMany(params);
  }

  updateUserSession(params: Prisma.SessionUpdateArgs): Promise<Session | null> {
    return this.db.session.update(params);
  }

  createUserSession(params: Prisma.SessionCreateArgs): Promise<Session> {
    return this.db.session.create(params);
  }

  deleteSessions(params: Prisma.SessionDeleteManyArgs): Promise<Prisma.BatchPayload> {
    return this.db.session.deleteMany(params)
  }

  getOtpCodeByUserId(userId: string): Promise<OTP | null> {
    return this.db.oTP.findUnique({
      where: { userId },
    });
  }

  deleteOtpTokens(
    params: Prisma.OTPDeleteManyArgs
  ): Promise<Prisma.BatchPayload> {
    return this.db.oTP.deleteMany(params);
  }

  createOtp(data: Prisma.OTPCreateArgs): Promise<OTP> {
    return this.db.oTP.create(data);
  }

  updateOtpCode(data: Prisma.OTPUpdateArgs): Promise<OTP | null> {
    return this.db.oTP.update(data);
  }
}

const authUserRepository = new AuthUserRpository();

export default authUserRepository;
