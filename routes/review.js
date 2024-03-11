const mongoose = require("mongoose");

const reviewSchema = mongoose.Schema({
    reviewname: {
        type: String,
        required: true
    },
    review: {
        type: String,
        required: true
    },
    reviewimage: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model("review", reviewSchema);
