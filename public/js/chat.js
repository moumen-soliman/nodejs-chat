var socket = io();

function scrollToBottom() {
  //Selectors
  let messages = jQuery('#messages');
  let newMessage = messages.children('li:last-child');
  //Heights
  let clientHeight = messages.prop('clientHeight');
  let scrollTop = messages.prop('scrollTop');
  let scrollHeight = messages.prop('scrollHeight');
  let newMessageHeight = newMessage.innerHeight();
  let lastMessageHeigt = newMessage.prev().innerHeight();

  if( clientHeight + scrollTop + newMessageHeight + lastMessageHeigt>= scrollHeight || scrollTop == 0 ){
    messages.scrollTop(scrollHeight);
  }
}

// ***** SocketIO Events ****

socket.on('connect', function () {

  var room_id = localStorage.getItem('room_id');
  var room_name = localStorage.getItem('room_name');
  var user_name = localStorage.getItem('user_name');
  var user_id = localStorage.getItem('user_id');
  var user_token = localStorage.getItem('user_token');


  if( !room_id || !room_name || !user_name || !user_id || !user_token) {
    alert('You have to sign in to start chatting');
    return window.location.href = '/';
  }

  //Set room name
  $('#room-name').html(room_name);

  var params = {
    room_id,
    user_token
  }

  socket.emit('join', params, function(err) {
    if(err){
      console.log('Error: '+ err);
      alert(err);
      window.location.href = '/';
    }

  });
});

socket.on('disconnect',function () {
  console.log('Disconnected from the server');
    socket.emit('leaveRoom', {
      user_name: localStorage.getItem('user_name'),
      user_id: localStorage.getItem('user_id'),
      room_id: localStorage.getItem('room_id')
    });
});

socket.on('updateUserList', function (users) {
  var ol = jQuery('<ol></ol>');

  users.forEach( function (user) {
    ol.append(jQuery('<li></li>').text(user.name));
  });

  jQuery('#users').html(ol);
});

socket.on('updateMessageList', function (messages) {

  var template = jQuery('#message-template').html();

  var messagesProcessed = 0;

  var request = messages.forEach( function (message, index) {
    var formatedTime = moment(message.createdAt).format('h:mm a');
    var html = Mustache.render(template, {
      from: message.from,
      text: message.text,
      createdAt: formatedTime,
      url: message.url
    });
    jQuery('#messages').append(html);
    messagesProcessed ++;
    if( messagesProcessed == messages.length){
      scrollToBottom();
    }
  });
});

socket.on('newMessage', function (message) {
  var formatedTime = moment(message.createdAt).format('h:mm a');
  var template = jQuery('#message-template').html();
  var html = Mustache.render(template, {
    from: message.from,
    text: message.text,
    createdAt: formatedTime,
    url: message.url
  });
  jQuery('#messages').append(html);
  scrollToBottom();
});


// ***** UI Events ****

var locationButton = jQuery('#send-location');
var message_form = jQuery('#message-form');
var _window = jQuery(window);

message_form.on('submit', function(e) {
  e.preventDefault();
  var text = jQuery('[name=message]').val();
  socket.emit('createMessage', {
    room_id: localStorage.getItem('room_id'),
    user_name: localStorage.getItem('user_name'),
    text: text
  }, function () {
    jQuery('[name=message]').val('');
  });
});

locationButton.on('click', function(){
  if (!navigator.geolocation) {
    return alert('Geolocation is not supported by your browser');
  }

  locationButton.attr('disabled', 'disabled').text('Sending location...');

  navigator.geolocation.getCurrentPosition(function(position){
    locationButton.removeAttr('disabled').text('Send location');
    socket.emit('createLocationMessage', {
      room_id: localStorage.getItem('room_id'),
      user_name: localStorage.getItem('user_name'),
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    });
  }, function(e){
    locationButton.removeAttr('disabled').text('Send location');
    alert('Unable to fetch location: ' + e.message);
  });


});
















// console.log('Just for scrolling');
