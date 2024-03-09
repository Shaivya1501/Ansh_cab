const mongoose = require("mongoose");

const serviceSchema = mongoose.Schema({
    servicename: {
        type: String,
        required: true
    },
    Servicedescription: {
        type: String,
        required: true
    },
    seviceimage: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model("service", serviceSchema);
