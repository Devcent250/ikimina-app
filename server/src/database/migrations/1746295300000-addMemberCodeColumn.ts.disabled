import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMemberCodeColumn1746295300000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if the table exists
        const tableExists = await queryRunner.hasTable("members");
        if (!tableExists) {
            return;
        }

        // Check if memberCode column already exists
        const columnExists = await queryRunner.hasColumn("members", "memberCode");
        
        if (!columnExists) {
            // Add the column as nullable first
            await queryRunner.query(`
                ALTER TABLE members 
                ADD COLUMN "memberCode" VARCHAR(4);
            `);
        }

        // Generate unique member codes for existing records (PostgreSQL compatible)
        await queryRunner.query(`
            UPDATE members
            SET "memberCode" = LPAD(id::text, 4, '0')
            WHERE "memberCode" IS NULL;
        `);

        // Now make it NOT NULL
        await queryRunner.query(`
            ALTER TABLE members 
            ALTER COLUMN "memberCode" SET NOT NULL;
        `);

        // Add unique constraint
        await queryRunner.query(`
            ALTER TABLE members 
            ADD CONSTRAINT "UQ_members_memberCode" UNIQUE ("memberCode");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove the unique constraint first
        await queryRunner.query(`
            ALTER TABLE members 
            DROP CONSTRAINT IF EXISTS "UQ_members_memberCode";
        `);

        // Drop the column
        await queryRunner.query(`
            ALTER TABLE members 
            DROP COLUMN IF EXISTS "memberCode";
        `);
    }
}
