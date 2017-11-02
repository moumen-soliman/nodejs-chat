const mongoose = require('mongoose');
const _ = require('lodash');

const RoomSchema = new.mongoose.Schema({
  name: {
    type: String,
    unique: true,
    minLengh: 1,
    maxlength: 45,
    trim: true
  },
  messages: [{
    from: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true,
      minLengh: 1
    },
    createdAt: {
      type: Number,
      required: true
    },
    url: {
      type: Boolean
    }
  }],
  users:[{
    name: String
  }]
});


const Room = mongoose.model('Room', RoomSchema);

module.exports = {Room};