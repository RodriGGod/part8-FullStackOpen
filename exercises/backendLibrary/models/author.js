const mongoose = require('mongoose')

const authorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Author name is required'],
    unique: true,
    minlength: [4, 'Author name must be at least 4 characters']
  },
  born: {
    type: Number
  }
})

module.exports = mongoose.model('Author', authorSchema)