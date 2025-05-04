import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTables1746284616987 implements MigrationInterface {
    name = 'UpdateTables1746284616987'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "location"`);
        await queryRunner.query(`CREATE TYPE "public"."groups_meetingday_enum" AS ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')`);
        await queryRunner.query(`ALTER TABLE "groups" ADD "meetingDay" "public"."groups_meetingday_enum"`);
        await queryRunner.query(`ALTER TABLE "groups" ADD "meetingStartTime" TIME`);
        await queryRunner.query(`ALTER TABLE "groups" ADD "meetingEndTime" TIME`);
        await queryRunner.query(`ALTER TABLE "groups" ADD "meetingLocation" character varying`);
        await queryRunner.query(`ALTER TABLE "groups" ADD "meetingLocationDetails" character varying`);
        await queryRunner.query(`ALTER TABLE "groups" ADD "meetingDurationMinutes" integer`);
        await queryRunner.query(`ALTER TABLE "groups" ADD "isActive" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "groups" ADD "additionalNotes" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "additionalNotes"`);
        await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "isActive"`);
        await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "meetingDurationMinutes"`);
        await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "meetingLocationDetails"`);
        await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "meetingLocation"`);
        await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "meetingEndTime"`);
        await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "meetingStartTime"`);
        await queryRunner.query(`ALTER TABLE "groups" DROP COLUMN "meetingDay"`);
        await queryRunner.query(`DROP TYPE "public"."groups_meetingday_enum"`);
        await queryRunner.query(`ALTER TABLE "groups" ADD "location" character varying`);
    }

}
