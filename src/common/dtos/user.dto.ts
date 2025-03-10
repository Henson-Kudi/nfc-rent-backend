import { BaseDto } from '@/common/dtos/base.dto';
import { UpdateUserSchema } from '../../modules/auth/utils/validations/user';
import { Expose, Type } from 'class-transformer';
import { LoginType, TOTPStatus } from '@/common/enums';
import { BookingDto, DriverDto, RoleDto, SessionDto } from '.';
import { CarOwnershipDetailDto } from '@/common/dtos/car-owner.dto';

export class UserDto extends BaseDto {
  @Expose()
  fullName!: string;
  @Expose()
  email!: string;
  @Expose()
  phone?: string;
  @Expose()
  photo?: string;
  @Expose()
  googleId?: string;
  @Expose()
  loginType!: LoginType;
  @Expose()
  emailVerified!: boolean;
  @Expose()
  phoneVerified!: boolean;
  @Expose()
  mfaEnabled!: boolean;
  @Expose()
  totpStatus?: TOTPStatus;
  @Expose()
  @Type(() => SessionDto)
  sessions!: SessionDto[];
  @Expose()
  @Type(() => CarOwnershipDetailDto)
  ownedCars?: CarOwnershipDetailDto[];

  @Expose()
  @Type(() => BookingDto)
  bookings?: BookingDto[];

  @Expose()
  @Type(() => DriverDto)
  drivers!: DriverDto[];

  @Expose()
  @Type(() => DriverDto)
  defaultDriver?: DriverDto;

  @Expose()
  @Type(() => RoleDto)
  roles!: RoleDto[];
}

export class UpdateUserDTO {
  constructor(data: UpdateUserData) {
    Object.assign(this, data);
  }

  fullName?: string;
  photo?: string;

  validate() {
    return UpdateUserSchema.validateAsync(this);
  }
}
