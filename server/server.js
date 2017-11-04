require('./config/config');
require('./db/mongoose');

const _ = require('lodash');
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');
const express = require('express');
const socketIO = require('socket.io');

const { ObjectID } = require('mongodb');
const { generateMessage, generateLocationMessage } = require('./utils/message');
const { isRealString } = require('./utils/validation');
const { Users } = require('./utils/users');
const { User } = require('./models/user');
const { Room } = require('./models/room');

const publicPath = path.join(__dirname, '../public');
const port = process.env.PORT || 3000;
var app = express();
var server = http.createServer(app);
var io = socketIO(server);
var users = new Users();

app.use(bodyParser.json());
app.use(express.static(publicPath));

Room.cleanAllUserList().then(() => {
    console.log('Rooms were cleaned');
}).catch((e) => {
    console.log(e);
});


io.on('connection', (socket) => { //related to socket in html file

    socket.on('join', (params, callback) => {

        let user;

        //Authenticate user
        User.findByToken(params.user_token).then((userDoc) => {
            if (!userDoc) {
                throw new Error('Invalid user');
            }
            user = userDoc;

            //Veirfy room id
            return Room.findById(params.room_id);
        }).then((roomDoc) => {

            let userList = roomDoc.getUsers();
            //Check if user is not duplicated
            let duplicated = userList.filter(u => u.name == user.name);
            console.log(duplicated);

            if (duplicated.length > 0) {
                throw new Error('Sorry. There is an user with this name, try another room :(');
            }

            socket.join(params.room_id);

            return roomDoc.addUser({
                _id: ObjectID(user._id),
                name: user.name
            });

        }).then((roomDoc) => {
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

        }).catch((e) => callback(e.message));

    });

    socket.on('createMessage', (message, callback) => {
        let tmp_room;
        Room.findById(newMessage.room_id).then((roomDoc) => {
            tmp_room = roomDoc;
            if (tmp_room && isRealString(newMessage.text)) {
                return roomDoc.addMessage(generateMessage(newMessage.user_name, newMessage.text));
            } else {
                return Promise.reject();
            }
        }).then((messageDoc) => {
            io.to(tmp_room._id).emit('newMessage', generateMessage(user.name, message.text));
            callback();
        });
    });

    socket.on('createLocationMessage', (coords) => {
        let tmp_room;
        Room.findById(newMessage.room_id).then((roomDoc) => {
            tmp_room = roomDoc;
            if (tmp_room && newMessage.latitude && newMessage.longitude) {
                return roomDoc.addMessage(generateLocationMessage(newMessage.user_name, newMessage.latitude, newMessage.longitude));
            } else {
                return Promise.reject();
            }
        }).then((messageDoc) => {
            io.to(tmp_room._id).emit('newMessage', generateLocationMessage(newMessage.user_name, newMessage.latitude, newMessage.longitude));
        });
    });

    socket.on('getRoom', (params, callback) => {
        Room.findOne({ name: params.name }).then((roomDoc) => {
            callback(roomDoc);
        }).catch((e) => {
            callback();
        });
    });

    socket.on('getRoomList', (callback) => {
        Room.getRoomList().then((roomList) => {
            callback(roomList);
        }).catch((e) => {
            callback();
        });
    });

    socket.on('newUser', (params, callback) => {
        let user = new User({
            name: params.name,
            email: params.email,
            password: params.password
        });

        user.save().then(() => {
            return user.generateAuthToken();
        }).then((token) => {
            callback(null, user, token);
        }).catch((e) => {
            callback(e);
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