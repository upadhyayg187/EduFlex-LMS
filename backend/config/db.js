const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Mongoose attempts to connect to the database using the URI from your .env file
        const conn = await mongoose.connect(process.env.MONGO_URI);

        // If successful, it logs a confirmation message
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        // If it fails, it logs the error and stops the server
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;