const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

const {generateMessage} = require('./utils/message');
const publicPath = path.join(__dirname, '../public');
const port = process.env.PORT || 3000;
var app = express();
var server = http.createServer(app);
var io = socketIO(server);

app.use(express.static(publicPath));

io.on('connection', (socket) => { //related to socket in html file
	console.log('New user connected');

	socket.on('createMessage', (message, callback) => {
		console.log('createMessage', message);

		//sockit.emit from admin and text
		// socket.emit('newMessage', generateMessage('Admin', 'Welcome to chat'));
		io.emit('newMessage', generateMessage(message.from, message.text));
		callback();
		//send message from one way and reseve it from one way , so open two tabbs and check
		// socket.broadcast.emit('newMessage', {
		// 	from: message.from,
		// 	text: message.text,
		// 	createdAt: new Date().getTime()
		// });
	});

	socket.on('disconnect', () => {
		console.log('User was connect');
	});
});

server.listen(port, () => {
	console.log(`Server is up on ${port}`)
});