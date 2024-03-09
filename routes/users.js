const mongoose = require('mongoose');
require('dotenv').config();
const plm = require('passport-local-mongoose');


const Connection = async () => {
  const URL = "mongodb+srv://sushantwork295:EQTlbTwxiJTR1Ahx@cluster0.lfufj0m.mongodb.net/taxiapp?retryWrites=true&w=majority&appName=Cluster0";

  try {
    await mongoose.connect(URL);
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Error connecting to the database', error);
  }
};

Connection();


const userSchema = mongoose.Schema({
  username:{
    type: String,
        unique: true,
        required: true,
        trim: true, // Automatically trims whitespace from both ends
        validate: {
            validator: function(value) {
                // Check if the username contains any whitespace
                return !/\s/.test(value);
            },
            message: 'Username must not contain spaces'
        }
  },
  fullname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  contact:{
    type:String, 
    unique:true,
    validate: {
    validator: function(v) {
      return /^([0-9]{10}$)/.test(v);
    }},
    required: true
    },
  role:{
    type:String,
    default:"customer"
  },
  password: {
    type: String
  } 
});


userSchema.plugin(plm);



module.exports = mongoose.model("users", userSchema);