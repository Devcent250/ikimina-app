import { MigrationInterface, QueryRunner } from "typeorm";

export class FixBranchConstraints1746295237188 implements MigrationInterface {
    name = 'FixBranchConstraints1746295237188'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // First, let's check what constraints exist and drop them all
        const constraints = await queryRunner.query(`
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'loan_categories' 
            AND constraint_type = 'FOREIGN KEY'
            AND constraint_name LIKE '%branch%'
        `);

        console.log('Found branch constraints:', constraints);

        // Drop all branch-related foreign key constraints
        for (const constraint of constraints) {
            try {
                await queryRunner.query(`ALTER TABLE "loan_categories" DROP CONSTRAINT "${constraint.constraint_name}"`);
                console.log(`Dropped constraint: ${constraint.constraint_name}`);
            } catch (error) {
                console.log(`Could not drop constraint ${constraint.constraint_name}:`, error.message);
            }
        }

        // Make the branchId column nullable
        await queryRunner.query(`ALTER TABLE "loan_categories" ALTER COLUMN "branchId" DROP NOT NULL`);

        // Add a new foreign key constraint that allows NULL values
        await queryRunner.query(`
            ALTER TABLE "loan_categories" 
            ADD CONSTRAINT "FK_loan_categories_branch_nullable" 
            FOREIGN KEY ("branchId") 
            REFERENCES "branches"("id") 
            ON DELETE SET NULL 
            ON UPDATE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the new constraint
        await queryRunner.query(`ALTER TABLE "loan_categories" DROP CONSTRAINT "FK_loan_categories_branch_nullable"`);

        // Make the column not nullable again
        await queryRunner.query(`ALTER TABLE "loan_categories" ALTER COLUMN "branchId" SET NOT NULL`);

        // Recreate the original constraint
        await queryRunner.query(`
            ALTER TABLE "loan_categories" 
            ADD CONSTRAINT "FK_loan_categories_branch" 
            FOREIGN KEY ("branchId") 
            REFERENCES "branches"("id") 
            ON DELETE NO ACTION 
            ON UPDATE NO ACTION
        `);
    }
} 