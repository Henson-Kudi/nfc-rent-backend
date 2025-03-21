import { MigrationInterface, QueryRunner } from 'typeorm';

export class LatestSchema1742468459222 implements MigrationInterface {
  name = 'LatestSchema1742468459222';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "contract" ("id" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isDeleted" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "number" character varying NOT NULL, "templatePath" character varying NOT NULL, "signedAt" TIMESTAMP NOT NULL, "clientSignature" character varying NOT NULL, "additionalDriverSign" character varying NOT NULL, "damages" jsonb NOT NULL, "fuelLevelPickup" integer NOT NULL, "fuelLevelReturn" integer, "mileageAtPickup" integer NOT NULL, "mileageAtReturn" integer, "isReturned" boolean NOT NULL DEFAULT false, "isTerminated" boolean NOT NULL DEFAULT false, "terminationReason" text, "pdfUrl" character varying(255), "isSigned" boolean NOT NULL DEFAULT false, "totalViolationCharges" numeric(10,2) NOT NULL DEFAULT '0', "totalDeductions" numeric(10,2) NOT NULL DEFAULT '0', "refundAmount" numeric(10,2), CONSTRAINT "UQ_86b89a6d689f50beb08b0537f6f" UNIQUE ("number"), CONSTRAINT "PK_17c3a89f58a2997276084e706e8" PRIMARY KEY ("id")); COMMENT ON COLUMN "contract"."fuelLevelPickup" IS 'Fuel level as percentage (0-100)'; COMMENT ON COLUMN "contract"."fuelLevelReturn" IS 'Fuel level as percentage (0-100)'`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."contract_voilation_violationtype_enum" AS ENUM('TRAFFIC FINE', 'LATE RETURN', 'SMOKING', 'DIRTY RETURN', 'DESERT DRIVING', 'DAMAGE', 'FUEL SHORTAGE', 'SALIK TOLL', 'BORDER CROSSING', 'MILEAGE EXCEEDED', 'OTHER')`
    );
    await queryRunner.query(
      `CREATE TABLE "contract_voilation" ("id" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isDeleted" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "violationType" "public"."contract_voilation_violationtype_enum" NOT NULL, "description" character varying(255) NOT NULL, "amount" numeric(10,2) NOT NULL, "totalUnits" integer NOT NULL DEFAULT '1', "processingFee" numeric(10,2) NOT NULL DEFAULT '0', "totalCharge" numeric(10,2) NOT NULL, "evidences" jsonb NOT NULL, "isPaid" boolean NOT NULL DEFAULT false, "isDeducted" boolean NOT NULL DEFAULT false, "violationDate" TIMESTAMP, "contractId" character varying, CONSTRAINT "PK_9949acd7220c0cc7617812f28d4" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "contract_violation_charge_setting" ("id" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "isDeleted" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying NOT NULL, "description" character varying(255) NOT NULL, "amount" numeric(10,2) NOT NULL, "processingFee" numeric(10,2) NOT NULL DEFAULT '0', CONSTRAINT "UQ_dfdc7b7a8bf5b8e20730a37fb75" UNIQUE ("name"), CONSTRAINT "PK_035c45df92c35c08503666d8718" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "rental_pricing" ADD "mileageLimit" integer NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "car" ADD "fuelTankSize" integer NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "car" ADD "securityDeposit" jsonb NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "booking" ADD "securityDeposit" jsonb NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "booking" ADD "number" character varying NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "booking" ADD CONSTRAINT "UQ_b9dae401653026cdb377b9024d3" UNIQUE ("number")`
    );
    await queryRunner.query(
      `ALTER TABLE "booking" ADD "plateNumber" character varying(100)`
    );
    await queryRunner.query(
      `ALTER TYPE "public"."payment_currency_enum" RENAME TO "payment_currency_enum_old"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payment_currency_enum" AS ENUM('TRC20', 'ETH', 'ERC20', 'USDT', 'USD', 'AED', 'EUR')`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ALTER COLUMN "currency" TYPE "public"."payment_currency_enum" USING "currency"::"text"::"public"."payment_currency_enum"`
    );
    await queryRunner.query(`DROP TYPE "public"."payment_currency_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "contract_voilation" ADD CONSTRAINT "FK_e65d0416fd7fad76964daf1e41b" FOREIGN KEY ("contractId") REFERENCES "contract"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "contract_voilation" DROP CONSTRAINT "FK_e65d0416fd7fad76964daf1e41b"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payment_currency_enum_old" AS ENUM('TRX', 'TRC20', 'ETH', 'ERC20', 'USD', 'AED', 'EUR')`
    );
    await queryRunner.query(
      `ALTER TABLE "payment" ALTER COLUMN "currency" TYPE "public"."payment_currency_enum_old" USING "currency"::"text"::"public"."payment_currency_enum_old"`
    );
    await queryRunner.query(`DROP TYPE "public"."payment_currency_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."payment_currency_enum_old" RENAME TO "payment_currency_enum"`
    );
    await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN "plateNumber"`);
    await queryRunner.query(
      `ALTER TABLE "booking" DROP CONSTRAINT "UQ_b9dae401653026cdb377b9024d3"`
    );
    await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN "number"`);
    await queryRunner.query(
      `ALTER TABLE "booking" DROP COLUMN "securityDeposit"`
    );
    await queryRunner.query(`ALTER TABLE "car" DROP COLUMN "securityDeposit"`);
    await queryRunner.query(`ALTER TABLE "car" DROP COLUMN "fuelTankSize"`);
    await queryRunner.query(
      `ALTER TABLE "rental_pricing" DROP COLUMN "mileageLimit"`
    );
    await queryRunner.query(`DROP TABLE "contract_violation_charge_setting"`);
    await queryRunner.query(`DROP TABLE "contract_voilation"`);
    await queryRunner.query(
      `DROP TYPE "public"."contract_voilation_violationtype_enum"`
    );
    await queryRunner.query(`DROP TABLE "contract"`);
  }
}
