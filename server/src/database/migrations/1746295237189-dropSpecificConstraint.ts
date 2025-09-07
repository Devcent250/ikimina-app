import { MigrationInterface, QueryRunner } from "typeorm";

export class DropSpecificConstraint1746295237189 implements MigrationInterface {
    name = 'DropSpecificConstraint1746295237189'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop the specific constraint that's causing the issue
        try {
            await queryRunner.query(`ALTER TABLE "loan_categories" DROP CONSTRAINT "FK_3ff57861742b5d7cd369a56ccc8"`);
            console.log('Successfully dropped constraint FK_3ff57861742b5d7cd369a56ccc8');
        } catch (error) {
            console.log('Could not drop constraint FK_3ff57861742b5d7cd369a56ccc8:', (error as Error).message);
        }

        // Make sure the branchId column is nullable (only if it's currently not null)
        try {
            const columnInfo = await queryRunner.query(`
                SELECT is_nullable
                FROM information_schema.columns
                WHERE table_name = 'loan_categories'
                AND column_name = 'branchId'
            `);

            if (columnInfo.length > 0 && columnInfo[0].is_nullable === 'NO') {
                await queryRunner.query(`ALTER TABLE "loan_categories" ALTER COLUMN "branchId" DROP NOT NULL`);
                console.log('Successfully made branchId column nullable');
            } else {
                console.log('branchId column is already nullable or does not exist');
            }
        } catch (error) {
            console.log('Could not make branchId nullable:', (error as Error).message);
        }

        // Add a new constraint that allows NULL values
        try {
            await queryRunner.query(`
                ALTER TABLE "loan_categories" 
                ADD CONSTRAINT "FK_loan_categories_branch_optional" 
                FOREIGN KEY ("branchId") 
                REFERENCES "branches"("id") 
                ON DELETE SET NULL 
                ON UPDATE CASCADE
            `);
            console.log('Successfully added new nullable constraint');
        } catch (error) {
            console.log('Could not add new constraint:', (error as Error).message);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the new constraint
        try {
            await queryRunner.query(`ALTER TABLE "loan_categories" DROP CONSTRAINT "FK_loan_categories_branch_optional"`);
        } catch (error) {
            console.log('Could not drop new constraint:', (error as Error).message);
        }

        // Make the column not nullable again
        await queryRunner.query(`ALTER TABLE "loan_categories" ALTER COLUMN "branchId" SET NOT NULL`);

        // Recreate the original constraint
        try {
            await queryRunner.query(`
                ALTER TABLE "loan_categories" 
                ADD CONSTRAINT "FK_3ff57861742b5d7cd369a56ccc8" 
                FOREIGN KEY ("branchId") 
                REFERENCES "branches"("id") 
                ON DELETE NO ACTION 
                ON UPDATE NO ACTION
            `);
        } catch (error) {
            console.log('Could not recreate original constraint:', (error as Error).message);
        }
    }
} 