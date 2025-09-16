const mongoose = require('mongoose')

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Book title is required'],
    unique: true,
    minlength: [2, 'Book title must be at least 2 characters']
  },
  published: {
    type: Number,
    required: [true, 'Published year is required']
  },
  genres: {
    type: [String],
    validate: {
      validator: (arr) => Array.isArray(arr) && arr.length > 0,
      message: 'At least one genre is required'
    },
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Author',
    required: true
  },
})

module.exports = mongoose.model('Book', bookSchema)
