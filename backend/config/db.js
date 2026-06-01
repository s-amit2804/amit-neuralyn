const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);

        console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
        return conn;
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        console.warn(`⚠️ Running backend without MongoDB. Database-dependent features will not work until a valid database is provided.`);
        // process.exit(1); // Exit process on DB failure
    }
};

module.exports = connectDB;
