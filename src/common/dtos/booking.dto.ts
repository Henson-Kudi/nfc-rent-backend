import { BaseDto } from '@/common/dtos/base.dto';
import { BookingStatus } from '@/common/enums';
import { LocalizedEnum } from '@/common/utils/localized-enum.decorator';
import { bookingStatusTranslations } from '@/common/utils/translations/booking-status.translation';
import { Expose, Type } from 'class-transformer';
import {
  PaymentDto,
  DriverDto,
  UserDto,
  CarDto,
  CreateDriverDto,
  ContractDto,
} from '.';

export class BookingDto extends BaseDto {
  @Expose()
  @Type(() => UserDto)
  user!: UserDto;

  @Expose()
  @Type(() => DriverDto)
  driver!: DriverDto;

  @Expose()
  @Type(() => CarDto)
  car!: CarDto;

  @Expose()
  pickupDate!: Date;

  @Expose()
  returnDate!: Date;

  @Expose()
  totalAmount!: number;

  @Expose()
  @LocalizedEnum(bookingStatusTranslations)
  status!: BookingStatus;

  @Expose()
  @Type(() => PaymentDto)
  payment!: PaymentDto;

  @Expose()
  @Type(() => ContractDto)
  contract?: ContractDto;

  @Expose()
  selectedAddons!: {
    addonId: string;
    priceOptionIndex: number;
    quantity?: number;
  }[];

  @Expose()
  cancellationReason?: string;

  @Expose()
  priceBreakdown?: Record<string, unknown>;
}

export class CreateBookingDto {
  locale?: SupportedLocales;
  userId!: string;
  driver!: string | CreateDriverDto;
  carId!: string;
  pickupDate!: DateInputType;
  returnDate!: DateInputType;
  pickupLocation?: string;
  returnLocation?: string;
  plateNumber!: string;
  pricing!: string; // pricing token generated by pricing service

  selectedAddons?: {
    addonId: string;
    priceOptionIndex: number; // ADDON HAS A LIST OF PRICES. THIS INDEX REFERS TO THE SELECTED PRICE INDEX
    quantity?: number;
  }[];
}
