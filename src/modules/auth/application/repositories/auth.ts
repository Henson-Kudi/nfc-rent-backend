import { User, Prisma, Session, OTP } from '@prisma/client';

export default interface IAuthUserRepository {
  findOne(params: Prisma.UserFindUniqueArgs): Promise<User | null>;
  findByEmail(email: string, options?: {
    include?: Prisma.UserInclude,
    select?: Prisma.UserSelect
  }): Promise<User | null>;
  findByPhone(phone: string, options?: {
    include?: Prisma.UserInclude,
    select?: Prisma.UserSelect
  }): Promise<User | null>;
  findById(id: string, options?: {
    include?: Prisma.UserInclude,
    select?: Prisma.UserSelect
  }): Promise<User | null>;
  findByEmailOrPhone(email: string, phone: string, options?: {
    include?: Prisma.UserInclude,
    select?: Prisma.UserSelect
  }): Promise<User | null>;
  createUser(data: Prisma.UserCreateArgs): Promise<User | null>;
  updateUser(data: Prisma.UserUpdateArgs): Promise<User | null>;

  // Sessions
  findUserSession(
    params: Prisma.SessionFindUniqueArgs
  ): Promise<Session | null>;
  findUserSessions(params: Prisma.SessionFindManyArgs): Promise<Session[]>;
  updateUserSession(params: Prisma.SessionUpdateArgs): Promise<Session | null>;
  createUserSession(params: Prisma.SessionCreateArgs): Promise<Session>;
  deleteSessions(params: Prisma.SessionDeleteManyArgs):Promise<Prisma.BatchPayload>

  // otps
  getOtpCodeByUserId(userId: string): Promise<OTP | null>;
  deleteOtpTokens(
    params: Prisma.OTPDeleteManyArgs
  ): Promise<Prisma.BatchPayload>;
  createOtp(data: Prisma.OTPCreateArgs): Promise<OTP>;
  updateOtpCode(data: Prisma.OTPUpdateArgs): Promise<OTP | null>;
}
