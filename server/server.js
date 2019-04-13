const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

const { getSecret } = require('./secrets');
const usersRoute = require('./routes/users');
const appRoute = require('./routes/app');
mongoose.Promise = global.Promise;
mongoose.connect(getSecret('dbUri')).then(
  () => {
    console.log('Connected to mongoDB');
  },
  (err) => console.log('Error connecting to mongoDB', err)
);

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'pug')
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(cookieParser());

//styles
app.use(express.static('public'))
//auth routes
app.use('/api/users', usersRoute);
//app routes
app.use('/app', appRoute);
//landing page
app.get('/', (req, res) => res.sendFile(__dirname+'/index.html'));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = { app };
