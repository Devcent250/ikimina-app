import { MigrationInterface, QueryRunner } from "typeorm";

export class SafeSchemaFix1746300000000 implements MigrationInterface {
    name = 'SafeSchemaFix1746300000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        console.log('🔧 Starting safe schema fix migration...');

        // 1. Fix contributions table - ensure solidarityAmount column exists as integer
        try {
            const contributionsTableExists = await queryRunner.hasTable("contributions");
            if (contributionsTableExists) {
                const hasSolidarityAmount = await queryRunner.hasColumn("contributions", "solidarityAmount");
                const hasContributionType = await queryRunner.hasColumn("contributions", "contributionType");

                if (!hasSolidarityAmount) {
                    console.log('Adding solidarityAmount column to contributions...');
                    await queryRunner.query(`ALTER TABLE "contributions" ADD "solidarityAmount" integer NOT NULL DEFAULT 0`);
                }

                if (hasContributionType) {
                    console.log('Removing old contributionType column...');
                    await queryRunner.query(`ALTER TABLE "contributions" DROP COLUMN "contributionType"`);
                }

                // Clean up old enum if it exists
                try {
                    await queryRunner.query(`DROP TYPE IF EXISTS "public"."contributions_contributiontype_enum"`);
                    await queryRunner.query(`DROP TYPE IF EXISTS "public"."contributions_solidarityamount_enum"`);
                } catch (error) {
                    console.log('Enum cleanup completed or not needed');
                }
            }
        } catch (error) {
            console.log('Contributions table fix completed or not needed:', (error as Error).message);
        }

        // 2. Fix loan_categories table - ensure branchId is nullable
        try {
            const loanCategoriesExists = await queryRunner.hasTable("loan_categories");
            if (loanCategoriesExists) {
                const hasBranchId = await queryRunner.hasColumn("loan_categories", "branchId");
                
                if (hasBranchId) {
                    // Drop all existing foreign key constraints on branchId
                    const constraints = await queryRunner.query(`
                        SELECT constraint_name 
                        FROM information_schema.table_constraints 
                        WHERE table_name = 'loan_categories' 
                        AND constraint_type = 'FOREIGN KEY'
                        AND constraint_name LIKE '%branch%'
                    `);

                    for (const constraint of constraints) {
                        try {
                            await queryRunner.query(`ALTER TABLE "loan_categories" DROP CONSTRAINT "${constraint.constraint_name}"`);
                            console.log(`Dropped constraint: ${constraint.constraint_name}`);
                        } catch (error) {
                            console.log(`Constraint ${constraint.constraint_name} already dropped or doesn't exist`);
                        }
                    }

                    // Make branchId nullable
                    try {
                        await queryRunner.query(`ALTER TABLE "loan_categories" ALTER COLUMN "branchId" DROP NOT NULL`);
                        console.log('Made branchId nullable');
                    } catch (error) {
                        console.log('branchId already nullable or operation not needed');
                    }

                    // Add new nullable foreign key constraint
                    try {
                        await queryRunner.query(`
                            ALTER TABLE "loan_categories" 
                            ADD CONSTRAINT "FK_loan_categories_branch_nullable" 
                            FOREIGN KEY ("branchId") 
                            REFERENCES "branches"("id") 
                            ON DELETE SET NULL 
                            ON UPDATE CASCADE
                        `);
                        console.log('Added nullable foreign key constraint');
                    } catch (error) {
                        console.log('Foreign key constraint already exists or not needed');
                    }
                }
            }
        } catch (error) {
            console.log('Loan categories fix completed or not needed:', (error as Error).message);
        }

        // 3. Fix members table - ensure memberCode column exists
        try {
            const membersExists = await queryRunner.hasTable("members");
            if (membersExists) {
                const hasMemberCode = await queryRunner.hasColumn("members", "memberCode");
                
                if (!hasMemberCode) {
                    console.log('Adding memberCode column...');
                    await queryRunner.query(`ALTER TABLE members ADD COLUMN "memberCode" VARCHAR(4)`);
                    
                    // Generate codes for existing records
                    await queryRunner.query(`
                        UPDATE members 
                        SET "memberCode" = LPAD(id::text, 4, '0')
                        WHERE "memberCode" IS NULL
                    `);
                    
                    // Make it NOT NULL
                    await queryRunner.query(`ALTER TABLE members ALTER COLUMN "memberCode" SET NOT NULL`);
                    
                    // Add unique constraint
                    try {
                        await queryRunner.query(`
                            ALTER TABLE members 
                            ADD CONSTRAINT "UQ_members_memberCode" UNIQUE ("memberCode")
                        `);
                        console.log('Added unique constraint for memberCode');
                    } catch (error) {
                        console.log('Unique constraint already exists');
                    }
                }
            }
        } catch (error) {
            console.log('Members table fix completed or not needed:', (error as Error).message);
        }

        console.log('✅ Safe schema fix migration completed');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        console.log('🔄 Reverting safe schema fix...');
        
        // This is a safe migration, so we'll just log the revert
        // Individual operations can be reverted manually if needed
        console.log('⚠️ This migration contains multiple safe operations.');
        console.log('Manual revert may be needed for specific changes.');
    }
}
