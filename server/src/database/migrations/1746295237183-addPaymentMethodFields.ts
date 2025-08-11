import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPaymentMethodFields1746295237183 implements MigrationInterface {
    name = 'AddPaymentMethodFields1746295237183'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contributions" ADD "documentReceipt" character varying`);
        await queryRunner.query(`ALTER TABLE "contributions" ADD "transactionId" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "contributions" DROP COLUMN "transactionId"`);
        await queryRunner.query(`ALTER TABLE "contributions" DROP COLUMN "documentReceipt"`);
    }
} 