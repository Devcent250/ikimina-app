import { MigrationInterface, QueryRunner } from "typeorm";

export class DropBranchConstraint1746295237187 implements MigrationInterface {
    name = 'DropBranchConstraint1746295237187'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if the constraint exists before dropping it
        const constraintExists = await queryRunner.query(`
            SELECT constraint_name
            FROM information_schema.table_constraints
            WHERE table_name = 'loan_categories'
            AND constraint_name = 'FK_3ff57861742b5d7cd369a56ccc8'
        `);

        if (constraintExists.length > 0) {
            // Drop the foreign key constraint
            await queryRunner.query(`ALTER TABLE "loan_categories" DROP CONSTRAINT "FK_3ff57861742b5d7cd369a56ccc8"`);
        }

        // Make the column nullable (only if it exists and is not null)
        const columnInfo = await queryRunner.query(`
            SELECT is_nullable
            FROM information_schema.columns
            WHERE table_name = 'loan_categories'
            AND column_name = 'branchId'
        `);

        if (columnInfo.length > 0 && columnInfo[0].is_nullable === 'NO') {
            await queryRunner.query(`ALTER TABLE "loan_categories" ALTER COLUMN "branchId" DROP NOT NULL`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Make the column not nullable again
        await queryRunner.query(`ALTER TABLE "loan_categories" ALTER COLUMN "branchId" SET NOT NULL`);
        
        // Recreate the foreign key constraint
        await queryRunner.query(`ALTER TABLE "loan_categories" ADD CONSTRAINT "FK_3ff57861742b5d7cd369a56ccc8" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }
} 