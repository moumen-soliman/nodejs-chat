require('./config/config');
require('./db/mongoose');

const _ = require('lodash');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const socketIO = require('socket.io');
const http = require('http');
const {ObjectID} = require('mongodb');


const {generateMessage, generateLocationMessage} = require('./utils/message');
const {isRealString} = require('./utils/validation');
const {User} = require('./models/user');
const {Room} = require('./models/room');

const port = process.env.PORT || 3000;
const public_path = path.join(__dirname, '../public')

var app = express();
var server = http.createServer(app);
var io = socketIO(server);

app.use( bodyParser.json() );
app.use( express.static(public_path) );

//REMOVE ALL USER CONNECTIONS

Room.cleanAllUserList().then( () => {
  console.log('Rooms were cleaned');
}).catch( (e) =>{
  console.log(e);
});

io.on('connection', (socket) => {


  socket.on('join', (params, callback) => {

    let user;

    //Authenticate user
    User.findByToken(params.user_token).then( (userDoc) => {
      if(!userDoc){
        throw new Error('Invalid user');
      }
      user = userDoc;

      //Veirfy room id
      return Room.findById(params.room_id);
    }).then( (roomDoc) => {

      let userList = roomDoc.getUsers();
      //Check if user is not duplicated
      let duplicated = userList.filter( u => u.name == user.name);
      console.log(duplicated);

      if( duplicated.length > 0){
        throw new Error('Sorry. There is an user with this name, try another room :(');
      }

      socket.join(params.room_id);

      return roomDoc.addUser({
        _id: ObjectID(user._id),
        name: user.name
      });

    }).then( (roomDoc) => {
      //Happy path
      io.to(params.room_id).emit('updateUserList', roomDoc.getUsers());
      // socket.emit('newMessage', generateMessage('Admin', 'Welcome to the chat app'));
      socket.emit('updateMessageList', roomDoc.getMessages());
      socket.broadcast.to(params.room_id).emit('newMessage', generateMessage('Admin', `${user.name} has joined`));

      //Setting custom data
      socket._customdata = {
        user_id: user._id.toString(),
        user_name: user.name,
        room_id: params.room_id
      };

      callback();

    }).catch( (e) => callback(e.message));

  });

  socket.on('createMessage', (newMessage, callback) => {
    //Get room
    let tmp_room;
    Room.findById(newMessage.room_id).then( (roomDoc) => {
      tmp_room = roomDoc;
      if(tmp_room && isRealString(newMessage.text)){
        return roomDoc.addMessage(generateMessage(newMessage.user_name, newMessage.text));
      }else {
        return Promise.reject();
      }
    }).then( (messageDoc) => {
      io.to(tmp_room._id).emit('newMessage', generateMessage(newMessage.user_name, newMessage.text));
      callback();
    });
  });

  socket.on('createLocationMessage', (newMessage) => {
    let tmp_room;
    Room.findById(newMessage.room_id).then( (roomDoc) => {
      tmp_room = roomDoc;
      if(tmp_room && newMessage.latitude && newMessage.longitude){
        return roomDoc.addMessage(generateLocationMessage(newMessage.user_name,newMessage.latitude, newMessage.longitude));
      }else {
        return Promise.reject();
      }
    }).then( (messageDoc) => {
      io.to(tmp_room._id).emit('newMessage', generateLocationMessage(newMessage.user_name,newMessage.latitude, newMessage.longitude));
    });
  });

  socket.on('newUser', (params, callback) => {

    let user = new User({
      name: params.name,
      email: params.email,
      password: params.password
    });

    user.save().then( () => {
      return user.generateAuthToken();
    }).then( (token) => {
      callback(null, user, token);
    }).catch( (e) => {
      callback(e);
    } );
  });

  socket.on('getRoomList', (callback) => {

    Room.getRoomList().then( (roomList) => {
      callback(roomList);
    }).catch( (e) => {
      callback();
    });

  });

  socket.on('getRoom', (params, callback) =>{

    Room.findOne({name: params.name}).then( (roomDoc) => {
      callback(roomDoc);
    }).catch( (e) => {
      callback();
    });
  });

  socket.on('signIn', (userClient, callback) => {
    let temp_user;
    User.findByCredentials(userClient.email, userClient.password).then( (user) => {
      temp_user = user;
      return user.generateAuthToken();
    }).then( (token) =>{
      callback(token, temp_user);
    }).catch( (e) => {
      callback();
    });
  });

  socket.on('signOut', (userClient, callback) => {

    //Returns true if token is removed

    User.findByToken(userClient.token).then( (user) =>{
      if(!user){
        return Promise.reject();
      }
      return user.removeToken(userClient.token);

    }).then( () =>{
      callback(true);
    }).catch( (e) => {
      callback(false);
    });

  });

  socket.on('newRoom', (roomClient, callback) =>{

    let tmp_newRoom;

    const room = new Room({
      name: roomClient.name
    });

    room.save().then( (newRoom) =>{
      tmp_newRoom = newRoom;
      return Room.getRoomList();
      //updateRoomList client

    }).then( (roomList) => {
      socket.broadcast.emit('updateRoomList', roomList);
      callback(tmp_newRoom);
    }).catch( () => {
      callback();
    });

  });

  socket.on('disconnect', () => {

    if( socket._customdata ){
      let params = socket._customdata;
      let tmp_room;
      Room.findById(params.room_id).then( (roomDoc) => {
        tmp_room = roomDoc;
        return tmp_room.removeUser(params.user_id);
      }).then( (userDoc) => {
        tmp_room.users = tmp_room.users.filter( user => user._id != params.user_id);
        io.to(params.room_id).emit('updateUserList', tmp_room.users);
        io.to(params.room_id).emit('newMessage', generateMessage('Admin', `${params.user_name} has left.`));

        console.log(`${params.user_name} has left room \'${tmp_room.name}\'`);
      }).catch( (e) => {
        console.log('error:' +e);
      });
    }

  });

});

server.listen(port, ()=> {
    console.log(`Server is up on port ${port}`);
});
