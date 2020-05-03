const mongoose = require('mongoose')

const messageSchema = mongoose.Schema({
    message: {
        type: String,
        required: true,
        trim: true
    },
    room_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Room'
    },
    sender_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
}, {
    timestamps: true
})

const Messages = mongoose.model("Messages", messageSchema)

module.exports = Messages
