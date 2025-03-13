import { User } from "@/common/entities";

export type UserWithVerificationType = User & {
  verificationType: OTPVERIFICATIONTYPES;
};
