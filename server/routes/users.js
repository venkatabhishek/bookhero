const express = require('express');
const bcrypt = require('bcryptjs');

const User = require('../models/user');
const Session = require('../models/session');
const { authenticate } = require('../middleware/authenticate');
const { csrfCheck } = require('../middleware/csrfCheck');
const { initSession, isEmail } = require('../utils/utils');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!isEmail(email)) {
      throw new Error('Email must be a valid email address.');
    }
    if (typeof password !== 'string') {
      throw new Error('Password must be a string.');
    }
    const user = new User({ email, password });
    const persistedUser = await user.save();
    const userId = persistedUser._id;

    const session = await initSession(userId);

    res
      .cookie('token', session.token, {
        httpOnly: true,
        sameSite: true,
        maxAge: 1209600000,
        secure: process.env.NODE_ENV === 'production',
      })
      .status(201).render('app')
      // .json({
      //   title: 'User Registration Successful',
      //   detail: 'Successfully registered new user',
      //   csrfToken: session.csrfToken,
      // });
  } catch (err) {
    res.status(400).render('signup', {
      error: err.message
    })
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!isEmail(email)) {
      throw new Error('Email must be a valid email address.');
    }
    if (typeof password !== 'string') {
      throw new Error('Password must be a string.');
    }
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("Email not found");
    }
    const userId = user._id;

    const passwordValidated = await bcrypt.compare(password, user.password);
    if (!passwordValidated) {
      throw new Error("Invalid Password");
    }

    const session = await initSession(userId);

    res
      .cookie('token', session.token, {
        httpOnly: true,
        sameSite: true,
        maxAge: 1209600000,
        secure: process.env.NODE_ENV === 'production',
      }).redirect('/app')
      // .json({
      //   title: 'Login Successful',
      //   detail: 'Successfully validated user credentials',
      //   csrfToken: session.csrfToken,
      // });
  } catch (err) {
    res.status(400).render('login', {
      error: err.message
    })
  }
});

router.post('/location', authenticate, async (req, res) => {
    const { userId } = req.session;
    const { longitude, latitude } = req.body;
    
    const user = await User.findById({ _id: userId });
    if(!isNaN(longitude) && !isNaN(latitude)){
      if(user){
        user.location = {
          "type" : "Point",
          "coordinates" : [
            longitude,
            latitude
          ]
        }

        user.save((newUser, error)=>{
          res.redirect('/app');
        });
      }
    }
    
})

router.delete('/me', authenticate, csrfCheck, async (req, res) => {
  try {
    const { userId } = req.session;
    const { password } = req.body;
    if (typeof password !== 'string') {
      throw new Error();
    }
    const user = await User.findById({ _id: userId });

    const passwordValidated = await bcrypt.compare(password, user.password);
    if (!passwordValidated) {
      throw new Error();
    }

    await Session.expireAllTokensForUser(userId);
    res.clearCookie('token');
    await User.findByIdAndDelete({ _id: userId });
    res.json({
      title: 'Account Deleted',
      detail: 'Account with credentials provided has been successfuly deleted',
    });
  } catch (err) {
    res.status(401).json({
      errors: [
        {
          title: 'Invalid Credentials',
          detail: 'Check email and password combination',
          errorMessage: err.message,
        },
      ],
    });
  }
});

router.get('/logout', authenticate, async (req, res) => {
  try {
    const { session } = req;
    await session.expireToken(session.token);
    res.clearCookie('token');

    res.render('login')
  } catch (err) {
    res.status(400).render('login')
  }
});

module.exports = router;
