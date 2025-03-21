import { Expose } from 'class-transformer';

export abstract class BaseDto {
  @Expose()
  id!: string;
  @Expose()
  isActive!: boolean;
  @Expose()
  isDeleted!: boolean;
  @Expose()
  createdAt!: string;
  @Expose()
  updatedAt?: string;
  @Expose()
  deletedAt?: string;
}
