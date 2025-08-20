import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateContributionTable1746295237182 implements MigrationInterface {
    name = 'UpdateContributionTable1746295237182'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contributions" RENAME COLUMN "contributionType" TO "solidarityAmount"`);
        await queryRunner.query(`ALTER TYPE "public"."contributions_contributiontype_enum" RENAME TO "contributions_solidarityamount_enum"`);
        await queryRunner.query(`ALTER TABLE "contributions" DROP COLUMN "solidarityAmount"`);
        await queryRunner.query(`ALTER TABLE "contributions" ADD "solidarityAmount" integer NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contributions" DROP COLUMN "solidarityAmount"`);
        await queryRunner.query(`ALTER TABLE "contributions" ADD "solidarityAmount" "public"."contributions_solidarityamount_enum" NOT NULL DEFAULT 'saving'`);
        await queryRunner.query(`ALTER TYPE "public"."contributions_solidarityamount_enum" RENAME TO "contributions_contributiontype_enum"`);
        await queryRunner.query(`ALTER TABLE "contributions" RENAME COLUMN "solidarityAmount" TO "contributionType"`);
    }

}
