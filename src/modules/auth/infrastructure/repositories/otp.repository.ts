import { OTP } from "@/common/entities";
import { Service } from "typedi";
import { Repository } from "typeorm";

@Service()
export class OTPRepository extends Repository<OTP> { }