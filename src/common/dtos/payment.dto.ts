import { BaseDto } from './base.dto';
import { PaymentStatus } from '@/common/enums';
import { LocalizedEnum } from '@/common/utils/localized-enum.decorator';
import { Expose, Transform, Type } from 'class-transformer';
import { BookingDto } from '.';
import { paymentStatusTranslations } from '@/common/utils/translations/payment-status.translation';

export class PaymentDto extends BaseDto {
  @Expose()
  @Type(() => BookingDto)
  booking!: BookingDto;

  @Expose()
  amount!: number;

  @Expose()
  currency!: string;

  @Expose()
  @LocalizedEnum(paymentStatusTranslations)
  status!: PaymentStatus;

  @Expose()
  transactionId?: string;

  @Expose()
  paymentMethod?: string;

  @Expose()
  cryptoAddress?: string;

  @Expose()
  paidAt?: Date;

  @Expose()
  @Transform(({ obj }) => obj?.paymentMetaData || null)
  metadata?: Record<string, unknown>;
}

export class CreatePaymentDto {
  bookingId!: string;
  amount!: number;
  currency!: string;
  transactionId?: string;
  paymentMethod?: string;
  cryptoAddress?: string;
  paidAt?: Date;
  metadata?: Record<string, unknown>;
}
