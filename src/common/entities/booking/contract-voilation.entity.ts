import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Base } from '../base';
import { ContractViolationType, MediaType } from '@/common/enums';
import { Contract } from '..';

@Entity()
export class ContractVoilation extends Base {
  @ManyToOne(() => Contract, (contract) => contract.violations)
  @JoinColumn()
  contract!: Contract;

  @Column({
    type: 'enum',
    enum: ContractViolationType,
  })
  violationType!: ContractViolationType;

  @Column({ type: 'varchar', length: 255 })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number; // cost per unit

  @Column({ type: 'int', default: 1 })
  totalUnits!: number; // number of units for the violation

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  processingFee!: number; // not based on units.

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalCharge!: number; // sum of: (amount * totalUnits)  + processingFee

  @Column('jsonb')
  evidences!: { type: MediaType; url: string }[]; //urls to files related to this violation

  @Column({ default: false })
  isPaid!: boolean; // if paid directly

  @Column({ default: false })
  isDeducted!: boolean; // if deducted from security deposit

  @Column({ type: 'timestamp', nullable: true })
  violationDate?: Date;
}

// Settings for charge of each violation type
@Entity()
export class ContractViolationChargeSetting extends Base {
  @Column({
    enum: ContractViolationType,
    unique: true,
    nullable: false,
  })
  name!: ContractViolationType;

  @Column({ type: 'varchar', length: 255 })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number; // cost per unit

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  processingFee!: number; //Not per unit
}
