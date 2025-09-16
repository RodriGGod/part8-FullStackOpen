const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    minlength: [3, 'Username must be at least 3 characters']
  },
  favoriteGenre: {
    type: String,
    required: [true, 'favoriteGenre is required']
  }
})

module.exports = mongoose.model('User', userSchema)
