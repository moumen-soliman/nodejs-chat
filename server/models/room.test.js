require('../config/config');
require('../db/mongoose');

const {ObjectID} = require('mongodb');
const expect = require('expect');
const {generateMessage, generateLocationMessage} = require('../utils/message');
const {Room} = require('./room');

//Seed data.
Room.remove({}).then();

const roomOneID = new ObjectID();
const roomTwoID = new ObjectID();
const roomThreID = new ObjectID();
const rooms = [{
  _id: roomOneID,
  name: 'room 1',
},{
  _id: roomTwoID,
  name: 'room test',
},{
  _id: roomThreID,
  name: 'fresh air',
}];

messageOneID = new ObjectID();
const messages = [
  generateMessage('Julio', 'Some Message XD'),
  generateLocationMessage('Jose',30,20)
];


describe('Room model', () =>{

  it('should create a new room', (done)=>{

    let room = new Room(rooms[0]);

    room.save().then( (roomDoc) => {
      expect(roomDoc._id).toExist();
      expect(roomDoc.name).toBe(rooms[0].name);
      done();

    }).catch( (e) => {
      done(e);
    });
  });

  it('should create multiple rooms', (done)=>{

    let room2 = new Room(rooms[1]);
    let room3 = new Room(rooms[2]);

    room2.save().then( (roomDoc) => {
      expect(roomDoc._id).toExist();
      expect(roomDoc.name).toBe(rooms[1].name);

      return room3.save();
    }).then( (roomDoc) => {
      expect(roomDoc._id).toExist();
      expect(roomDoc.name).toBe(rooms[2].name);

      done();
    }).catch( (e) => {
      done(e);
    });
  });

  it('should not create a room with name duplicated', (done)=>{

    let room = new Room(rooms[0]);

    room.save().then( (roomDoc) => {
      expect(roomDoc).toNotExist();
      done(e);

    }).catch( (e) => {
      done();
    });
  });

  it('should add a new message to the room', (done) =>{
    Room.findOne({ _id: roomOneID}).then( (roomDoc) => {
      if(roomDoc){
        return roomDoc.addMessage(messages[0]);
      }else{
        Promise.reject();
      }
    }).then( (message) => {
      expect(message).toEqual(messages[0]);
      done();
    }).catch( (e) => {
      done(e);
    });
  });

  it('should add a new location message to the room', (done) =>{
    Room.findOne({ _id: roomOneID}).then( (roomDoc) => {
      if(roomDoc){
        return roomDoc.addMessage(messages[1]);
      }else{
        Promise.reject();
      }
    }).then( (message) => {
      expect(message).toEqual(messages[1]);
      done();
    }).catch( (e) => {
      done(e);
    });
  });

  it('should get all room\'s name', (done) =>{
    Room.getRoomList().then( (roomList) => {
      expect(roomList.length).toBe(3);
      expect(roomList[0]).toBe('room 1');
      expect(roomList[2]).toBe('fresh air');
      done();
    }).catch( (e) =>{
      done(e);
    });
  });


});
