import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateContributionTable1746295237182 implements MigrationInterface {
    name = 'UpdateContributionTable1746295237182'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if the contributionType column exists
        const hasContributionType = await queryRunner.hasColumn("contributions", "contributionType");
        const hasSolidarityAmount = await queryRunner.hasColumn("contributions", "solidarityAmount");

        if (hasContributionType && !hasSolidarityAmount) {
            // First, add the new solidarityAmount column as integer
            await queryRunner.query(`ALTER TABLE "contributions" ADD "solidarityAmount" integer NOT NULL DEFAULT 0`);

            // Then drop the old contributionType column and its enum
            await queryRunner.query(`ALTER TABLE "contributions" DROP COLUMN "contributionType"`);

            // Drop the enum type if it exists
            try {
                await queryRunner.query(`DROP TYPE IF EXISTS "public"."contributions_contributiontype_enum"`);
            } catch (error) {
                console.log('Enum type does not exist or already dropped');
            }
        } else if (!hasSolidarityAmount) {
            // If contributionType doesn't exist but solidarityAmount doesn't either, just add solidarityAmount
            await queryRunner.query(`ALTER TABLE "contributions" ADD "solidarityAmount" integer NOT NULL DEFAULT 0`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Check if solidarityAmount column exists
        const hasSolidarityAmount = await queryRunner.hasColumn("contributions", "solidarityAmount");

        if (hasSolidarityAmount) {
            // Drop the solidarityAmount column
            await queryRunner.query(`ALTER TABLE "contributions" DROP COLUMN "solidarityAmount"`);

            // Recreate the enum type
            await queryRunner.query(`CREATE TYPE "public"."contributions_contributiontype_enum" AS ENUM('saving', 'solidarity')`);

            // Add back the contributionType column with enum
            await queryRunner.query(`ALTER TABLE "contributions" ADD "contributionType" "public"."contributions_contributiontype_enum" NOT NULL DEFAULT 'saving'`);
        }
    }

}
