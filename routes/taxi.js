const mongoose = require("mongoose");

const taxiSchema = mongoose.Schema({
    taxiname: {
        type: String,
        required: true
    },
    taxitype: {
        type: String,
        required: true
    },
    taxiimage1: {
        type: String,
        required: true
    },
    taxiimage2: {
        type: String,
        required: true
    },
    taxiimage3: {
        type: String,
        required: true
    },
    taxifare: {
        type: String,
        required: true
    },
    sittingcapecity: {
        type: Number,
        required: true
    },
    taxidescription:{
        type:String,
        required : true
    }
});

module.exports = mongoose.model("taxi", taxiSchema);