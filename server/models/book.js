const mongoose = require('mongoose');


const BookSchema = new mongoose.Schema({
  title: String,
  author: String,
  imgURL: String,
  owner: String, //email of owner
  status : {
    type: Number, 
    default: 0
  },
  checker: {
    type: String, 
    default: ""
  },
  location: {
    type: {
      type: String, 
      enum: ['Point'], 
    },
    coordinates: {
      type: [Number],
    }
  }
});


module.exports = mongoose.model('Book', BookSchema);
