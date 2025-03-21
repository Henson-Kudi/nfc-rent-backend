import { Expose, Type } from 'class-transformer';
import { BaseDto } from './base.dto';
import { BookingDto, ContractViolationDto } from '.';
import { CreateContractVoilationDto } from './contract-violation.dto';

export class ContractDto extends BaseDto {
  @Expose()
  @Type(() => BookingDto)
  booking!: BookingDto;
  @Expose()
  number!: string;
  @Expose()
  templatePath?: string;
  @Expose()
  signedAt?: Date;
  @Expose()
  clientSignature?: string;
  @Expose()
  additionalDriverSign?: string;
  @Expose()
  damages?: CarDamage[];
  @Expose()
  @Type(() => ContractViolationDto)
  violations?: ContractViolationDto[];
  @Expose()
  fuelLevelPickup!: number;
  @Expose()
  fuelLevelReturn?: number;
  @Expose()
  mileageAtPickup!: number;
  @Expose()
  mileageAtReturn?: number;
  @Expose()
  isReturned!: boolean;
  @Expose()
  isTerminated!: boolean;
  @Expose()
  terminationReason?: string;
  @Expose()
  pdfUrl?: string;
  @Expose()
  isSigned!: boolean;
  @Expose()
  totalViolationCharges!: number;
  @Expose()
  totalDeductions!: number;
  @Expose()
  refundAmount?: number;
}

export class CreateContractDto {
  bookingId!: string;
  templatePath?: string;
  signedAt?: DateInputType;
  clientSignature?: string;
  additionalDriverSign?: string;
  damages?: CarDamage[];
  violations?: CreateContractVoilationDto[];
  fuelLevelPickup!: number;
  fuelLevelReturn?: number;
  mileageAtPickup!: number;
  mileageAtReturn?: number;
}
