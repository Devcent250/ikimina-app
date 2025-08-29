import { AppDataSource } from "../data-source";

async function fixMemberCode() {
  try {
    console.log("🔄 Initializing database connection...");
    await AppDataSource.initialize();
    
    console.log("✅ Database connected successfully");
    
    const queryRunner = AppDataSource.createQueryRunner();
    
    try {
      // Check if memberCode column already exists
      const columnExists = await queryRunner.hasColumn("members", "memberCode");
      
      if (!columnExists) {
        console.log("📝 Adding memberCode column as nullable...");
        // Add the column as nullable first
        await queryRunner.query(`
          ALTER TABLE members 
          ADD COLUMN "memberCode" VARCHAR(4);
        `);
        console.log("✅ Column added successfully");
      } else {
        console.log("ℹ️ Column already exists, skipping creation");
      }

      // Generate unique member codes for existing records
      console.log("🔄 Generating member codes for existing records...");
      await queryRunner.query(`
        UPDATE members 
        SET "memberCode" = LPAD(CAST(id AS VARCHAR), 4, '0')
        WHERE "memberCode" IS NULL;
      `);
      console.log("✅ Member codes generated successfully");

      // Now make it NOT NULL
      console.log("🔄 Making column NOT NULL...");
      await queryRunner.query(`
        ALTER TABLE members 
        ALTER COLUMN "memberCode" SET NOT NULL;
      `);
      console.log("✅ Column set to NOT NULL");

      // Add unique constraint (if it doesn't exist)
      console.log("🔄 Checking/adding unique constraint...");
      try {
        await queryRunner.query(`
          ALTER TABLE members 
          ADD CONSTRAINT "UQ_members_memberCode" UNIQUE ("memberCode");
        `);
        console.log("✅ Unique constraint added successfully");
      } catch (error: any) {
        if (error.code === '42P07') {
          console.log("ℹ️ Unique constraint already exists, skipping");
        } else {
          throw error;
        }
      }

      console.log("🎉 All operations completed successfully!");
      
    } finally {
      await queryRunner.release();
    }
    
  } catch (error) {
    console.error("❌ Error occurred:", error);
  } finally {
    await AppDataSource.destroy();
    console.log("🔌 Database connection closed");
  }
}

// Run the script
fixMemberCode();
