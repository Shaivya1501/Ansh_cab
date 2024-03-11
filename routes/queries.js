const mongoose = require("mongoose");

const queriesSchema = mongoose.Schema({
    queriename: {
        type: String,
        required: true
    },
    query: {
        type: String,
        required: true
    },
    Phone: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model("queries", queriesSchema);
