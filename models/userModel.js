const mongoose = require('mongoose');
const crypto = require('crypto');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const timezoneOffset = new Date().getTimezoneOffset() * 60 * 1000;

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Please provide your name'] },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: { type: String, default: 'default.jpg' },
  role: {
    type: String,
    enum: ['admin', 'user', 'guide', 'lead-guide'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide your password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // This only works on SAVE or CREATE! not on findOneAndUpdate
      validator: function (confirmPassword) {
        return confirmPassword === this.password;
      },
      message: 'Passwords are not the same',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: { type: Boolean, default: true, select: false },
});

// QUERY MIDDLEWARE
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew) {
    return next();
  }
  this.passwordChangedAt = Date.now() - timezoneOffset - 1000;
  next();
});

userSchema.pre('save', async function (next) {
  // isModified is Mongoose specific function
  // only run this function if password was modified
  if (!this.isModified('password')) {
    return next();
  }

  // hash pw
  this.password = await bcrypt.hash(this.password, 12);
  // delete passwordConfirm field before saving
  this.passwordConfirm = undefined;
  next();
});

userSchema.methods.comparePasswords = async (candidatePassword, userPassword) =>
  await bcrypt.compare(candidatePassword, userPassword);

userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimeStamp - timezoneOffset < changedTimeStamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000 - timezoneOffset;
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
