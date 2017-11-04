const mongoose = require('mongoose');
const _ = require('lodash');

const RoomSchema = new mongoose.Schema({
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

RoomSchema.methods.addMessage = function(message){

  this.messages.push(message);

  return this.save().then( () => message );
};

RoomSchema.methods.getUsers = function(){
  return this.users;
}

RoomSchema.methods.getMessages = function(){
  return this.messages;
}

RoomSchema.methods.addUser = function(user){
  this.users.push(user);

  return this.save().then( (roomDoc) => roomDoc );
}

RoomSchema.methods.removeUser = function(id){
  return this.update({
    $pull: {
      users: {
        _id: id
      }
    }
  });
}

RoomSchema.statics.getRoomList = function (){
  const Room = this;

  return Room.find({}).then( (rooms) => {
    let roomList = [];
    rooms.forEach( (room) =>{
      roomList[rooms.indexOf(room)] = room.name ;
    });
    return new Promise ( resolve => resolve(roomList) );
  });

};

RoomSchema.statics.cleanAllUserList = function (){
  const Room = this;

  return Room.find({}).then( (rooms) => {

    const fn = function updateValue(r){
      r.set({ users: [] });
      r.save();
    }

    const actions = rooms.map(fn);

    return Promise.all(actions);

    // results.then( () => {
    //   return new Promise ( resolve => resolve(true) );
    // });

  });

};

const Room = mongoose.model('Room', RoomSchema);

module.exports = {Room};
