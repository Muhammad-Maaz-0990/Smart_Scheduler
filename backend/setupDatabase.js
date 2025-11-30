const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/smart_scheduler";

// List of all required collections
const requiredCollections = [
  "users",
  "instituteinformations",
  "rooms",
  "classes",
  "timeslots",
  "ownerusers",
  "institutesubscriptions",
  "feedbacks",
  "feedbackmessages",
  "courses",
  "institutetimetables"
];


// Function to ensure collections exist and have sample data
async function ensureCollections() {
  try {
    const db = mongoose.connection.db;
    const existing = await db.listCollections().toArray();
    const existingNames = existing.map((c) => c.name);

    console.log('\n📋 Checking collections...\n');

    // First, create institute if needed (as other collections reference it)
    let instituteId = null;
    const instituteCol = "instituteinformations";
    
    if (!existingNames.includes(instituteCol)) {
      console.log(`🟦 Creating collection: ${instituteCol}`);
      await db.createCollection(instituteCol);
    } else {
      console.log(`✔️  Collection exists: ${instituteCol}`);
    }

    const instituteCount = await db.collection(instituteCol).countDocuments();
    if (instituteCount === 0) {
      console.log(`➕ Inserting sample data into ${instituteCol}`);
      const result = await db.collection(instituteCol).insertOne(sampleData[instituteCol]);
      instituteId = result.insertedId;
      console.log(`   Institute ID: ${instituteId}`);
    } else {
      const institute = await db.collection(instituteCol).findOne({});
      instituteId = institute._id;
      console.log(`✔️  ${instituteCol} already has data (ID: ${instituteId})`);
    }

    // Process remaining collections
    for (const col of requiredCollections) {
      if (col === "instituteinformations") continue; // Already processed

      if (!existingNames.includes(col)) {
        console.log(`🟦 Creating collection: ${col}`);
        await db.createCollection(col);
      } else {
        console.log(`✔️  Collection exists: ${col}`);
      }

      const count = await db.collection(col).countDocuments();

      if (count === 0) {
        console.log(`➕ Inserting sample data into ${col}`);
        
        // Set foreign key references
        const data = { ...sampleData[col] };
        
        if (data.hasOwnProperty('instituteID') && data.instituteID === null) {
          data.instituteID = instituteId;
        }

        try {
          await db.collection(col).insertOne(data);
          console.log(`   ✅ Successfully inserted sample data`);
        } catch (err) {
          console.log(`   ⚠️  Warning: Could not insert sample data - ${err.message}`);
        }
      } else {
        console.log(`✔️  ${col} already has data (${count} documents)`);
      }
    }

    console.log('\n');
  } catch (error) {
    console.error('❌ Error in ensureCollections:', error);
    throw error;
  }
}

// Function to create indexes for better performance
async function createIndexes() {
  try {
    console.log('📑 Creating indexes for better performance...\n');
    
    const db = mongoose.connection.db;

    // Users indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ userName: 1 }, { unique: true });
    await db.collection('users').createIndex({ instituteID: 1 });
    
    // OwnerUsers indexes
    await db.collection('ownerusers').createIndex({ email: 1 }, { unique: true });
    await db.collection('ownerusers').createIndex({ userName: 1 }, { unique: true });
    
    // InstituteInformation indexes
    await db.collection('instituteinformations').createIndex({ instituteName: 1 }, { unique: true });
    
    // Courses indexes
    await db.collection('courses').createIndex({ courseCode: 1, instituteID: 1 }, { unique: true });
    
    // Rooms indexes
    await db.collection('rooms').createIndex({ roomNumber: 1, instituteID: 1 }, { unique: true });
    
    console.log('✅ Indexes created successfully!\n');
  } catch (error) {
    // Ignore duplicate key errors (indexes already exist)
    if (error.code !== 11000) {
      console.log('⚠️  Warning: Some indexes may already exist\n');
    }
  }
}

// Main function
async function main() {
  try {
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║     Smart Scheduler - Database Setup Script         ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    console.log('⏳ Connecting to MongoDB...');
    console.log(`   URI: ${uri.replace(/\/\/.*:.*@/, '//***:***@')}\n`); // Hide credentials in log
    
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB!\n');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}\n`);

    // Ensure all collections exist with sample data
    await ensureCollections();

    // Create indexes
    await createIndexes();

    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║          🎉 Database Setup Complete! 🎉              ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    console.log('📝 Summary:');
    console.log('   ✅ All required collections verified/created');
    console.log('   ✅ Sample data inserted where needed');
    console.log('   ✅ Indexes created for performance');
    console.log('   ✅ Database is ready to use!\n');

    await mongoose.connection.close();
    console.log('🔌 Connection closed.\n');
    
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error during database setup:', err.message);
    console.error('\nStack trace:', err.stack);
    
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, ensureCollections, createIndexes };
