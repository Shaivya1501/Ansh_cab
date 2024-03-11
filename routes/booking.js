const mongoose = require("mongoose");

const bookingSchema = mongoose.Schema({
    Name: {
        type: String,
        required: true
    },
    taxitype: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    pickuplocation: {
        type: String,
        default: "regular"      // regular, featured, discount
    },
    droplocation: {
        type: String,
    },
    contact:{
        type: Number,
        required: true
    },
    date:{
        type : Date,
        required : true
    },
    bookingstatus:{
        type : Boolean,
        default : false,
    }
});


module.exports = mongoose.model("booking", bookingSchema);
