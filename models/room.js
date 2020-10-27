const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    room: {
        type: Number,
        required: true
    },
    videoID: {
        type: String,
        required: true
    },
    masterSocket: {
        type: String,
        required: false
    },
    sockets: {
        type: Array,
        required: false
    }
});

const Room = mongoose.model('room', roomSchema);

module.exports = Room;