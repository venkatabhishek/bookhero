const express = require('express')
const request = require('request');
const router = express.Router();
const parseString = require('xml2js').parseString;
const { authenticate } = require('../middleware/authenticate');
const User = require('../models/user');

router.get('/login', function (req, res) {
    res.render('login')
})

router.get('/register', function (req, res) {
    res.render('signup')
})

router.get('/', authenticate, function(req, res) {
    res.render('app');
})

router.get('/search', function(req, res){
    var { q, page } = req.query;


    request({
        url: "https://www.goodreads.com/search/index.xml",
        qs: {
            key: "eredMupgksAVklid5r3GQ",
            q,
            page
        }
    }, function(error, response, body){
        if(error){
            res.render('add')
        }else{
            parseString(body, function(err, result){
                res.render('add', {results: result.GoodreadsResponse.search[0].results[0].work})
            })
        }

    })
})

router.post('/query', function(req, res){

})

router.get('/add', authenticate, function(req, res) {
    res.render('add')
})

router.get('/profile', authenticate, async function(req, res) {
    try {
        const { userId } = req.session;
        var user = await User.findById({ _id: userId });
        
        res.render('profile', { user });
    } catch (err) {
        res.status(401).render('login', {error: err.message})
    }
})

module.exports = router;