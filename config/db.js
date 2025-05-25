const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const ConnectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      
    });
    console.log('MongoDB connected');
  } catch(err) {
    console.error(err.message);
    process.exit(1);
  }
};
module.exports = ConnectDB;
