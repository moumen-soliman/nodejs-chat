const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

var UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    required: true,
    trim: true,
    type: String,
    minLengh: 1,
    unique: true,
    validate: {
      validator: (value) =>{
        return validator.isEmail(value);
      },
      message: '{VALUE} is not a valid email'
    }
  },
  password: {
    type: String,
    required: true,
    minLengh: 6
  },
  tokens: [{
    access: {
      type: String,
      required: true
    },
    token: {
      type: String,
      required: true
    }
  }]
});

var User = mongoose.model('User', UserSchema);

module.exports = {User};