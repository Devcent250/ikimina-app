import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateLoanCategories1746295237184 implements MigrationInterface {
    name = 'CreateLoanCategories1746295237184'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "loan_categories" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "description" text NOT NULL, "defaultAmount" integer NOT NULL, "interestRate" numeric(5,2) NOT NULL, "minAmount" integer, "maxAmount" integer, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "createdById" integer, "branchId" integer, CONSTRAINT "PK_loan_categories" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "loan_categories" ADD CONSTRAINT "FK_loan_categories_createdBy" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "loan_categories" ADD CONSTRAINT "FK_loan_categories_branch" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "loan_categories" DROP CONSTRAINT "FK_loan_categories_branch"`);
        await queryRunner.query(`ALTER TABLE "loan_categories" DROP CONSTRAINT "FK_loan_categories_createdBy"`);
        await queryRunner.query(`DROP TABLE "loan_categories"`);
    }
} 