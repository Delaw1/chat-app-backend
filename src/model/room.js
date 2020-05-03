const mongoose = require('mongoose')

const roomSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    user1: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    user2: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    }
}, {
    timestamps: true
})

// roomSchema.virtual("users", {
//     ref: "User",
//     localField: "_id",
//     foreignField: "room_id"
// })

const Room = mongoose.model("Room", roomSchema)

module.exports = Room