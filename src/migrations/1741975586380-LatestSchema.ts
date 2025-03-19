import { MigrationInterface, QueryRunner } from "typeorm";

export class LatestSchema1741975586380 implements MigrationInterface {
    name = 'LatestSchema1741975586380'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "address_mapping" ALTER COLUMN "derivationIndex" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "address_mapping" ALTER COLUMN "derivationIndex" DROP NOT NULL`);
    }

}
