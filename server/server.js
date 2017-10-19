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

	socket.emit('newMessage', {
		from: 'Mohamed',
		text: 'See you then',
		createdAt: 123123
	});

	socket.on('createMessage', (message) => {
		console.log('createMessage', message);
	});

	socket.on('disconnect', () => {
		console.log('User was connect');
	})
});

server.listen(port, () => {
	console.log(`Server is up on ${port}`)
});