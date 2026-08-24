// initMongo.js
// One-time initialization script for ecd-assessment MongoDB database

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import crypto from "crypto";
import "dotenv/config";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ecd_assessment";

// Previously these four seed accounts were created with hardcoded, publicly
// visible passwords (admin123/dist123/teach123/stud123) on every fresh
// deploy, with no forced change on first login. This script is idempotent
// (skips users that already exist), so it only matters on the very first
// run against an empty database — but that first run is exactly when it
// matters most. Each seed password can now be pinned via an environment
// variable (useful for scripted/CI setups); if not set, a random strong
// password is generated and printed once so the operator can capture it.
// These accounts still don't have a forced-password-change flow — that's a
// follow-up (see AUTH_SECURITY_FIXES.md) — so treat these as temporary and
// rotate them by hand after first login.
function seedPassword(envVar) {
  return process.env[envVar] || crypto.randomBytes(12).toString("base64url");
}

async function init() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI, { dbName: "ecd_assessment" });

    const db = mongoose.connection.db;
    console.log("✅ Connected to", db.databaseName);

    // ------------------------------
    // 1️⃣ Create Questions Collection
    // ------------------------------
    const collections = await db.listCollections().toArray();
    const exists = collections.some((c) => c.name === "questions");

    if (!exists) {
      console.log("🆕 Creating 'questions' collection...");
      await db.createCollection("questions");
    } else {
      console.log("ℹ️ 'questions' collection already exists");
    }

    const questionColl = db.collection("questions");
    console.log("⚙️ Creating indexes on { id, status, metadata.subject, metadata.grade }...");
    await questionColl.createIndex({ id: 1 }, { unique: true });
    await questionColl.createIndex({ status: 1 });
    await questionColl.createIndex({ "metadata.subject": 1 });
    await questionColl.createIndex({ "metadata.grade": 1 });
    console.log("✅ Question indexes created successfully");

    // ------------------------------
    // 2️⃣ Create Users Collection
    // ------------------------------
    const userExists = collections.some((c) => c.name === "users");
    if (!userExists) {
      console.log("🆕 Creating 'users' collection...");
      await db.createCollection("users");
    } else {
      console.log("ℹ️ 'users' collection already exists");
    }

    const usersColl = db.collection("users");
    // 3️⃣ Define MongoDB schema (students  teachers)
    console.log("⚙️ Ensuring users schema with profile subdocument...");
    await usersColl.createIndex({ username: 1 }, { unique: true });
    await usersColl.createIndex({ role: 1 });
    await usersColl.createIndex({ "profile.districtId": 1 });
    await usersColl.createIndex({ "profile.state": 1 });

    // Document structure reference (for clarity only)
    /*
      {
        username: "teacher1",
        password: "<bcrypt-hash>",
        role: "teacher" | "student" | "admin" | "district",
        email: "teacher1@school.local",
        profile: {
          // For Students
          name: "Student Name",
          emisId: "EMIS1234",
          apaarId: "APAAR1234",
          grade: "Class 8",
          districtId: "D001",
          state: "Tamil Nadu",

          // For Teachers
          designation: "PG Assistant",
          subject: "Mathematics",
          emisId: "TCH9876",
          udiseId: "UDISE8765",
          districtId: "D001",
          state: "Tamil Nadu"
        },
        createdAt: ISODate(),
        updatedAt: ISODate()
      }
    */
    
    // 4️⃣ Default users (admin, district, teacher, student)
    // Passwords are pinned via env vars if set (SEED_ADMIN_PASSWORD, etc.),
    // otherwise randomly generated per run — see seedPassword() above.
    const defaultUsers = [
      {
        username: "admin1",
        role: "admin",
        password: seedPassword("SEED_ADMIN_PASSWORD"),
        email: "admin@ecd.local",
      },
      {
        username: "dist1",
        role: "district",
        password: seedPassword("SEED_DISTRICT_PASSWORD"),
        email: "district@ecd.local",
      },
      {
        username: "teach1",
        role: "teacher",
        password: seedPassword("SEED_TEACHER_PASSWORD"),
        email: "teacher@ecd.local",
      },
      {
        username: "stud1",
        role: "student",
        password: seedPassword("SEED_STUDENT_PASSWORD"),
        email: "student@ecd.local",
      },
    ];

    console.log("👥 Creating default users...");
    const createdCredentials = [];

    for (const user of defaultUsers) {
      const exists = await usersColl.findOne({ username: user.username });
      if (!exists) {
        const hashed = await bcrypt.hash(user.password, 10);
        await usersColl.insertOne({
          username: user.username,
          email: user.email,
          role: user.role,
          password: hashed,
          createdAt: new Date(),
        });
        createdCredentials.push({ username: user.username, role: user.role, password: user.password });
        console.log(`✅ Created user: ${user.username} (${user.role})`);
      } else {
        console.log(`ℹ️ User '${user.username}' already exists, skipping.`);
      }
    }

    if (createdCredentials.length) {
      console.log("\n🔐 Seed account credentials (shown only this once — capture them now):");
      for (const c of createdCredentials) {
        console.log(`   ${c.username} (${c.role}) / ${c.password}`);
      }
      console.log("   Change these passwords after first login.\n");
    }

    // Indexes for users
    console.log("⚙️ Creating user indexes...");
    await usersColl.createIndex({ username: 1 }, { unique: true });
    await usersColl.createIndex({ role: 1 });
    console.log("✅ User indexes created successfully");

    // ------------------------------
    // 3️⃣ Verify setup
    // ------------------------------
    const questionIndexes = await questionColl.indexes();
    const userIndexes = await usersColl.indexes();

    console.log("📚 Question Indexes:", questionIndexes);
    console.log("📚 User Indexes:", userIndexes);

    console.log("🎉 MongoDB initialization complete for ecd_assessment");
  } catch (err) {
    console.error("❌ Initialization failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Connection closed.");
  }
}

init();
