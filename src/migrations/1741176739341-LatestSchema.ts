import { MigrationInterface, QueryRunner } from "typeorm";

export class LatestSchema1741176739341 implements MigrationInterface {
    name = 'LatestSchema1741176739341'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "car" DROP COLUMN "virtualTourUrl"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "car" ADD "virtualTourUrl" character varying`);
    }

}
