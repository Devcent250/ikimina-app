import { MigrationInterface, QueryRunner } from "typeorm";

export class UserNewFields1744927167861 implements MigrationInterface {
    name = 'UserNewFields1744927167861'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "branchId" integer`);
        await queryRunner.query(`ALTER TABLE "user" ADD "groupId" integer`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_8b17d5d91bf27d0a33fb80ade8f" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_974590e8d8d4ceb64e30c38e051" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_974590e8d8d4ceb64e30c38e051"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_8b17d5d91bf27d0a33fb80ade8f"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "groupId"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "branchId"`);
    }

}
