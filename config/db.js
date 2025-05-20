const mongoose = require('mongoose');

const ConnectDB = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/chatterly', {
      useNewUrlParser: true,
      
    });
    console.log('MongoDB connected');
  } catch(err) {
    console.error(err.message);
    process.exit(1);
  }
};
module.exports = ConnectDB;
