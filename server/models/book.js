const mongoose = require('mongoose');


const BookSchema = new mongoose.Schema({
  title: String,
  author: String,
  ISBN: Number,
  quantity: {
      type: Number,
      default: 1
  },
  owner: String //email of owner
});


module.exports = mongoose.model('Book', BookSchema);
