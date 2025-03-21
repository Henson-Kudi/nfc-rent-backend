import { BaseDto } from './base.dto';
import { Expose, Type } from 'class-transformer';
import { BookingDto, UserDto } from '.';
import { LocalizedEnum } from '@/common/utils/localized-enum.decorator';
import { driverTypeTranslation } from '@/common/utils/translations/driver-type.translation';
import { DriverType } from '@/common/enums';

export class DriverDto extends BaseDto {
  @Expose()
  @Type(() => UserDto)
  user?: UserDto;
  @Expose()
  @Type(() => BookingDto)
  bookings?: BookingDto[];
  @Expose()
  firstName!: string;
  @Expose()
  lastName!: string;
  @Expose()
  email!: string;
  @Expose()
  phoneNumber!: string;
  @Expose()
  dateOfBirth!: Date;
  @Expose()
  country!: string;
  @Expose()
  @LocalizedEnum(driverTypeTranslation)
  driverType!: DriverType;
  @Expose()
  idNumber?: string;
  @Expose()
  idIssueDate?: Date;
  @Expose()
  idExpiryDate?: Date;
  @Expose()
  idFrontImage?: string;
  @Expose()
  idBackImage?: string;
  @Expose()
  licenseNumber!: string;
  @Expose()
  licenseIssueDate?: Date;
  @Expose()
  licenseExpiryDate?: Date;
  @Expose()
  licenseFrontImage?: string;
  @Expose()
  licenseBackImage?: string;
  @Expose()
  passportNumber!: string;
  @Expose()
  passportIssueDate?: Date;
  @Expose()
  passportExpiryDate?: Date;
  @Expose()
  passportFrontImage?: string;
  @Expose()
  passportBackImage?: string;
  @Expose()
  visaNumber?: string;
  @Expose()
  visaIssueDate?: Date;
  @Expose()
  visaExpiryDate?: Date;
  @Expose()
  visaImage?: string;
  @Expose()
  isDefault!: boolean;
  @Expose()
  additionalDocuments?: Array<{
    type: string;
    documentNumber: string;
    expiryDate: Date;
  }>;
}

export class CreateDriverDto {
  userId!: string;
  firstName!: string;
  lastName!: string;
  email!: string;
  phoneNumber!: string;
  dateOfBirth!: Date;
  country!: string;
  driverType!: DriverType;
  idNumber?: string;
  idIssueDate?: Date;
  idExpiryDate?: Date;
  idFrontImage?: string;
  idBackImage?: string;
  licenseNumber!: string;
  licenseIssueDate?: Date;
  licenseExpiryDate?: Date;
  licenseFrontImage?: string;
  licenseBackImage?: string;
  passportNumber!: string;
  passportIssueDate?: Date;
  passportExpiryDate?: Date;
  passportFrontImage?: string;
  passportBackImage?: string;
  visaNumber?: string;
  visaIssueDate?: Date;
  visaExpiryDate?: Date;
  visaImage?: string;
  isDefault!: boolean;
  additionalDocuments?: Array<{
    url: string;
    type: string;
    documentNumber: string;
    expiryDate: Date;
  }>;
}
