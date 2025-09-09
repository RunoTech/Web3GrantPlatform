import bcrypt from "bcrypt";
import { db } from "./db";
import { admins } from "../shared/schema";
import { eq } from "drizzle-orm";

async function seedAdmin() {
  console.log("🌱 Starting admin user seeding...");

  try {
    // Check if admin already exists
    const existingAdmin = await db
      .select()
      .from(admins)
      .where(eq(admins.username, "admin"))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log("✅ Admin user already exists!");
      console.log(`Username: ${existingAdmin[0].username}`);
      console.log(`Email: ${existingAdmin[0].email}`);
      console.log(`Role: ${existingAdmin[0].role}`);
      console.log(`Active: ${existingAdmin[0].active}`);
      return;
    }

    // Create password hash
    const password = "admin123456"; // Default password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create admin user
    const [newAdmin] = await db
      .insert(admins)
      .values({
        username: "admin",
        email: "admin@duxxan.com",
        passwordHash: hashedPassword,
        role: "super_admin",
        active: true,
        lastLogin: null,
      })
      .returning();

    console.log("✅ Admin user created successfully!");
    console.log("📋 Admin Credentials:");
    console.log(`   Username: ${newAdmin.username}`);
    console.log(`   Email: ${newAdmin.email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: ${newAdmin.role}`);
    console.log(`   Active: ${newAdmin.active}`);
    console.log("");
    console.log("🔗 Admin Panel Access:");
    console.log("   URL: http://localhost:5000/admin/login");
    console.log("");
    console.log("⚠️  IMPORTANT SECURITY NOTES:");
    console.log("   - Change the default password immediately in production");
    console.log("   - Set JWT_SECRET environment variable for production");
    console.log("   - Enable proper firewall rules for admin access");

  } catch (error) {
    console.error("❌ Error seeding admin user:", error);
    throw error;
  }
}

// Enhanced seeding with platform settings
async function seedPlatformSettings() {
  console.log("🌱 Starting platform settings seeding...");

  const { platformSettings } = await import("../shared/schema");

  try {
    // Check if platform settings exist
    const existingSettings = await db.select().from(platformSettings).limit(1);

    if (existingSettings.length > 0) {
      console.log("✅ Platform settings already exist!");
      return;
    }

    // Insert default platform settings
    const defaultSettings = [
      {
        key: "platform_name",
        value: "DUXXAN",
        category: "general",
        description: "Platform name displayed across the application",
        updatedBy: 1,
      },
      {
        key: "platform_description",
        value: "Professional Web3 donation platform built for Ethereum networks",
        category: "general",
        description: "Main platform description",
        updatedBy: 1,
      },
      {
        key: "maintenance_mode",
        value: "false",
        category: "system",
        description: "Enable/disable maintenance mode",
        updatedBy: 1,
      },
      {
        key: "registration_enabled",
        value: "true",
        category: "system",
        description: "Allow new user registrations",
        updatedBy: 1,
      },
      {
        key: "daily_reward_enabled",
        value: "true",
        category: "features",
        description: "Enable daily reward system",
        updatedBy: 1,
      },
      {
        key: "affiliate_system_enabled",
        value: "true",
        category: "features",
        description: "Enable affiliate referral system",
        updatedBy: 1,
      },
    ];

    await db.insert(platformSettings).values(defaultSettings);

    console.log("✅ Platform settings seeded successfully!");
    console.log(`   ${defaultSettings.length} settings created`);

  } catch (error) {
    console.error("❌ Error seeding platform settings:", error);
    throw error;
  }
}

async function main() {
  console.log("🚀 DUXXAN Admin Seeding Started");
  console.log("================================");

  try {
    await seedAdmin();
    await seedPlatformSettings();
    
    console.log("");
    console.log("🎉 Seeding completed successfully!");
    console.log("You can now access the admin panel at: http://localhost:5000/admin/login");
    
  } catch (error) {
    console.error("💥 Seeding failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => {
      console.log("✅ Seeding process finished");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Seeding process failed:", error);
      process.exit(1);
    });
}

export { seedAdmin, seedPlatformSettings };