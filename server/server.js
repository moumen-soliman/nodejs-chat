const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

const publicPath = path.join(__dirname, '../public');
const port = process.env.PORT || 3000;
var app = express();
var server = http.createServer(app);
var io = socketIO(server);

app.use(express.static(publicPath));

io.on('connection', (socket) => { //related to socket in html file
	console.log('New user connected');

	socket.on('createMessage', (message) => {
		console.log('createMessage', message);

		//sockit.emit from admin and text
		socket.emit('newMessage', {
			from: 'Admin',
			text: 'Welcome to the chat'
			createdAt: new Date().getTime()
		});
		
		//socket.broadcast.emit from admin text new user joined
		socket.broadcast.emit('newMessage', {
			from: 'Admin',
			text: 'New user join now',
			createdAt: new Date().getTime()
		});


		io.emit('newMessage', {
			from: message.from,
			text: message.text,
			createdAt: new Date().getTime()
		});

		//send message from one way and reseve it from one way , so open two tabbs and check
		// socket.broadcast.emit('newMessage', {
		// 	from: message.from,
		// 	text: message.text,
		// 	createdAt: new Date().getTime()
		// });
	});

	socket.on('disconnect', () => {
		console.log('User was connect');
	})
});

server.listen(port, () => {
	console.log(`Server is up on ${port}`)
});