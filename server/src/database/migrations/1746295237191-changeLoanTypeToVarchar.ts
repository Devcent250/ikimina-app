import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeLoanTypeToVarchar1746295237191 implements MigrationInterface {
    name = "ChangeLoanTypeToVarchar1746295237191";

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop default tied to enum, change column type to varchar, then set string default
        await queryRunner.query(
            `ALTER TABLE "loans" ALTER COLUMN "loanType" DROP DEFAULT`
        );
        await queryRunner.query(
            `ALTER TABLE "loans" ALTER COLUMN "loanType" TYPE character varying USING "loanType"::text`
        );
        await queryRunner.query(
            `ALTER TABLE "loans" ALTER COLUMN "loanType" SET DEFAULT 'Other'`
        );
        // Drop old enum type if it still exists
        await queryRunner.query(
            `DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'loans_loantype_enum') THEN DROP TYPE "public"."loans_loantype_enum"; END IF; END $$;`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Recreate enum type and revert column
        await queryRunner.query(
            `CREATE TYPE "public"."loans_loantype_enum" AS ENUM('Emergency', 'Business', 'Education', 'Other')`
        );
        await queryRunner.query(
            `ALTER TABLE "loans" ALTER COLUMN "loanType" DROP DEFAULT`
        );
        await queryRunner.query(
            `ALTER TABLE "loans" ALTER COLUMN "loanType" TYPE "public"."loans_loantype_enum" USING "loanType"::text::"public"."loans_loantype_enum"`
        );
        await queryRunner.query(
            `ALTER TABLE "loans" ALTER COLUMN "loanType" SET DEFAULT 'Other'`
        );
    }
}


