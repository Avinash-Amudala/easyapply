const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
require('dotenv').config(); // Ensure .env variables are loaded

const setupAdmin = async () => {
    try {
        // 🔹 Ensure MONGO_URI is defined
        if (!process.env.MONGO_URI) {
            throw new Error('❌ MONGO_URI is not set in .env file.');
        }

        // 🔹 Ensure ADMIN_EMAIL and ADMIN_PASSWORD exist
        if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
            throw new Error('❌ ADMIN_EMAIL or ADMIN_PASSWORD is missing in .env file.');
        }

        console.log('🚀 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('✅ Connected to MongoDB.');

        // 🔹 Check if admin already exists
        const adminExists = await User.findOne({ role: 'admin' });

        if (adminExists) {
            console.log(`⚠️ Admin user already exists: ${adminExists.email}`);
        } else {
            console.log('🛠️ Creating admin user...');

            // 🔹 Hash the password before storing
            const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
            const adminUser = new User({
                name: 'Admin',
                email: process.env.ADMIN_EMAIL,
                password: hashedPassword,
                role: 'admin',
            });

            await adminUser.save();
            console.log(`✅ Admin user created successfully: ${adminUser.email}`);
        }

        // 🔹 Close MongoDB connection properly
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error setting up admin:', error.message);
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed due to error.');
        process.exit(1);
    }
};

// Run the setup script
setupAdmin();
