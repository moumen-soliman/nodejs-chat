require('./config/config');
require('./db/mongoose');

const _ = require('lodash');
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');
const express = require('express');
const socketIO = require('socket.io');

const {ObjectID} = require('mongodb');
const {generateMessage, generateLocationMessage} = require('./utils/message');
const {isRealString} = require('./utils/validation');
const {Users} = require('./utils/users');
const {Room} = require('./models/room');

const publicPath = path.join(__dirname, '../public');
const port = process.env.PORT || 3000;
var app = express();
var server = http.createServer(app);
var io = socketIO(server);
var users = new Users();

app.use( bodyParser.json() );
app.use(express.static(publicPath));

Room.cleanAllUserList().then( () => {
  console.log('Rooms were cleaned');
}).catch( (e) =>{
  console.log(e);
});


io.on('connection', (socket) => { //related to socket in html file
	console.log('New user connected');


	socket.on('join', (params, callback) => {
		if (!isRealString(params.name) || !isRealString(params.room)) {
			return callback('Name and room name are required');
		}

		socket.join(params.room);
		users.removeUser(socket.id);
		users.addUser(socket.id, params.name, params.room);

		io.to(params.room).emit('updateUserList', users.getUserList(params.room));
		socket.emit('newMessage', generateMessage('Support', `Welcome to ${params.room} chat`));
		socket.broadcast.to(params.room).emit('newMessage', generateMessage('Support', `${params.name} has joined`));
		callback();
	});

	socket.on('createMessage', (message, callback) => {
		let tmp_room;
		Room.findById(newMessage.room_id).then( (roomDoc) => {
			tmp_room = roomDoc;
			if(tmp_room && isRealString(newMessage.text)){
				return roomDoc.addMessage(generateMessage(newMessage.user_name, newMessage.text));
			}else{
				return Promise.reject();
			}
		}).then( (messageDoc) => {
			io.to(tmp_room._id).emit('newMessage', generateMessage(user.name, message.text));
			callback();
		});
	});

	socket.on('createLocationMessage', (coords) => {
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

	socket.on('getRoom', (params, callback) => {
		Room.findOne({name: params.name}).then ( (roomDoc) => {
			callback(roomDoc);
		}).catch( (e) => {
			callback();
		});
	});

	socket.on('getRoomList', (callback) => {
		Room.getRoomList().then( (roomList) => {
			callback(roomList);
		}).catch( (e) => {
			callback();
		});
	});

	socket.on('disconnect', () => {
		var user = users.removeUser(socket.id);

		if (user) {
			io.to(user.room).emit('updateUserList', users.getUserList(user.room));
			io.to(user.room).emit('newMessage', generateMessage('Support', `${user.name} has left`));
		}
	});
});

server.listen(port, () => {
	console.log(`Server is up on ${port}`)
});