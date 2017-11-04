var socket = io();

// jQuery Selectors
var sign_in_form = jQuery('#join-form');
var sign_up_form = jQuery('#sign-form');
var room_form = jQuery('#room-form');

var main_container = jQuery('#main-container');
var sign_up = jQuery('#sign_up');
var sign_in = jQuery('#sign_in');
var room_selector = jQuery('#room-selector');

var sign_out = jQuery('#sign_out');

socket.on('connect', function () {

  //Get room list
  socket.emit('getRoomList', function(roomList){
    if(roomList){
      localStorage.setItem('room_list', roomList);
    }

    //verify if user is logged in.
    if( localStorage.getItem('user_token') ){
      showRoomForm(localStorage.getItem('user_name'));
    }else{
      sign_in_form.removeClass('invisible');
    }

    main_container.removeClass('invisible');

  });

});

socket.on('updateRoomList', function(rooms) {
  console.log('something got update');
  localStorage.setItem('room_list', rooms);
  showRoomForm(localStorage.getItem('user_name'));

});

sign_in_form.on('submit', function(e) {
  e.preventDefault();
  //Get users list to check if a user with same name is log in.
  var email = jQuery('[name=email]').val();
  var password = jQuery('[name=password]').val();
  socket.emit('signIn', {
    email: email,
    password: password
  }, function(token, user) {
    if(user ){
      ls_sign_in(user, token);
      console.log(user);

      showRoomForm(user.name);
      sign_in_form.addClass('invisible');
      alert('Welcome ' + user.name + ' you can start chatting now!');
    }else{
      alert('Sorry, we could not find a user');
    }

  });

});

sign_up_form.on('submit', function(e) {
  e.preventDefault();

  var name = jQuery('[name=s_name]').val();
  var password = jQuery('[name=s_password]').val();
  var email = jQuery('[name=s_email]').val();

  socket.emit('newUser', {
    name: name,
    email: email,
    password: password
  }, function(error, user, token) {

    if(!error){
      ls_sign_in(user, token);
      showRoomForm(localStorage.getItem('user_name'));
      sign_up_form.addClass('invisible');
      alert('Welcome ' + user.name + ' you can start chatting now!');
    }else {
      alert('Sorry, ' + email + ' is already taken. Try another email.');
    }

  });
});

room_form.on('submit', function(e) {
  e.preventDefault();

  var value = room_selector.val();

  //new room option
  if(value == 1){

    var roomName = jQuery('[name=roomName]').val();
    roomName = validString(roomName);
    if(!!roomName){
      socket.emit('newRoom', {
        name: roomName
      }, function(room) {
        if(room){
          alert('Room created successfuly');
          localStorage.setItem('room_id', room._id);
          localStorage.setItem('room_name', room.name);
          window.location.href = '/chat.html';
        }else {
          alert('Unable to create the room, room name is unique');
        }
      });
    }else{
      alert('Invalid room name.');
    }

  }else{
    // Option selected
    var room = $( "#room-selector option:selected" ).text();

    //fetch room id
    socket.emit('getRoom', {
      name: room
    }, function(room) {

      if(room){
        localStorage.setItem('room_id', room._id);
        localStorage.setItem('room_name', room.name);
        window.location.href = '/chat.html';
      } else{
        alert('There is an error with this room, please chose another one.');
      }
    });
  }
});

sign_up.on('click', function() {
  sign_in_form.addClass('invisible');
  sign_up_form.removeClass('invisible');
});

sign_in.on('click', function() {
  sign_in_form.removeClass('invisible');
  sign_up_form.addClass('invisible');
});

sign_out.on('click', function() {

  socket.emit('signOut', {
    token: localStorage.getItem('user_token')
  }, function(success){
    if(success){
      ls_sign_out();
      room_form.addClass('invisible');
      sign_in_form.removeClass('invisible');
      alert('You have successfuly signed out');
    }else{
      alert('There was an error loggin out');
    }
  });



});

room_selector.on('change', function() {
  var value = room_selector.val();


  if (value == 1 ){
    $('#new-room').show();
  }
});

function showRoomForm(userName) {

  var roomList = ['Select a room','Add a new room'];
  var roomObject = [];
  var template = jQuery('#rooms-template').html();

  //GET ROOM LIST
  if( localStorage.getItem('room_list') ){
    roomList = roomList.concat(localStorage.getItem('room_list').split(','));
  }

  for(idx in roomList){
    roomObject.push({index: idx, name: roomList[idx]});
  }

  var data = {
    rooms: roomObject,
  }

  var html = Mustache.render(template, data);
  jQuery('#room-selector').html(html);
  jQuery('#userName').html(userName);

  room_form.removeClass('invisible');
};

function ls_sign_in(user, token){
  localStorage.setItem('user_token', token);
  localStorage.setItem('user_name', user.name);
  localStorage.setItem('user_id', user._id);
}

function validString( val ){
  if(val){
    val = val.trim();
    return typeof val === 'string' && val.length > 0 ? val : false;
  }else
    return false;
}

function ls_sign_out(){
  let rl = localStorage.getItem('room_list');
  localStorage.clear();
  localStorage.setItem('room_list', rl);
}
