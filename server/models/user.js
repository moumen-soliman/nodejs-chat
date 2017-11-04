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

UserSchema.methods.toJSON = function () {
  let user = this;
  let userObject = user.toObject();

  return _.pick(userObject, ['_id', 'email', 'name']);
};

UserSchema.methods.generateAuthToken = function (){
  let user = this;
  let access = 'auth';
  let token = jwt.sign({_id: user._id.toHexString(), access}, process.env.JWT_SECRET).toString();

  user.tokens.push({access, token});

  return user.save().then( () => {
    return token;
  } );
};

UserSchema.methods.removeToken = function (token){
  let user = this;

  return user.update({
    $pull: {
      tokens: {token}
    }
  });
};

UserSchema.statics.findByToken = function (token){
  var User = this;
  var decoded;

  try{
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch(e) {
    return Promise.reject();
  }

  return User.findOne({
    '_id': decoded._id,
    'tokens.token': token,
    'tokens.access': 'auth'
  });

};

UserSchema.statics.findByCredentials = function (email, password){
  var User = this;

  return User.findOne({email}).then( (user) => {
    if(!user)
      return Promise.reject();

    return new Promise( (resolve, reject) => {
      bcrypt.compare(password, user.password, (err, res) => {
        if(res){
          resolve(user);
        }else{
          reject();
        }
      });
    } )
  });


};

UserSchema.pre('save', function (next){
  var user = this;

  if(user.isModified('password')){
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(user.password, salt, (err, hash) => {
        user.password = hash;
        next();
      });
    });

  }else{
    next();
  }
});

var User = mongoose.model('User', UserSchema);

module.exports = {User};
