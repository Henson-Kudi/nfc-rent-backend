import { MigrationInterface, QueryRunner } from "typeorm";

export class LatestSchema1741975193681 implements MigrationInterface {
    name = 'LatestSchema1741975193681'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "address_mapping" ADD "derivationIndex" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "address_mapping" DROP COLUMN "derivationIndex"`);
    }

}
