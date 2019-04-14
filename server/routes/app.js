const express = require('express')
const request = require('request');
const router = express.Router();
const parseString = require('xml2js').parseString;
const { authenticate } = require('../middleware/authenticate');
const User = require('../models/user');
const Book = require('../models/book');

router.get('/login', function (req, res) {
    res.render('login');
})

router.get('/register',  function (req, res) {
    res.render('signup');
});

router.get('/', authenticate, async function(req, res) {

    const { userId } = req.session;
    var user = await User.findById({ _id: userId });

    Book.find({owner: {$ne: user.email}, checker: {$eq: ""}}, function(err, books){
        res.render('app', { books });
    });
    
});

router.get('/find', authenticate, async function(req, res){
    var { q, radius } = req.query;

    const { userId } = req.session;
    var user = await User.findById({ _id: userId });
    Book.find({
        owner: {$ne: user.email},
        checker: {$eq: ""},
        $or:[
        {title:{ "$regex": q, $options: "i" }},
        {author:{ "$regex": q, $options: "i" }}
    ]}).where('location').within({ center: [user.location.coordinates[0], user.location.coordinates[1]], radius: 200, unique: true, spherical: true })
        .then(docs => {
            res.render('search', { results:docs });
        });
})

router.post('/checkout', authenticate, async function(req, res){

    var { _id } = req.body;

    const { userId } = req.session;
    var user = await User.findById({ _id: userId });

    Book.findOne({_id}, function(err, bk){
        if(err) console.log(err)

        bk.checker = user.email;
        bk.status = 1;

        bk.save(function(){
            res.json({
                message: "Success"
            })
        })
    })
})

router.post('/return', authenticate, async function(req, res) {
    var { _id } = req.body;

    const { userId } = req.session;
    var user = await User.findById({ _id: userId });

    Book.findOne({_id}, function(err, bk){
        bk.checker = "";
        bk.status = 0;

        bk.save();
    })
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

router.post('/remove', function(req, res){

    var { _id } = req.body;

    Book.deleteOne({ _id }, function (err) {
        if (err) console.log(err)
      });
})

router.get('/add', authenticate, function(req, res) {
    res.render('add')
})

router.post('/add', authenticate, async function(req, res) {
    const { userId } = req.session;
    var user = await User.findById({ _id: userId });

    const { title, author, imgURL } = req.body;

    if(user){
        var new_book = new Book({ title, author, imgURL, owner: user.email, location: user.location});

        new_book.save((err, new_book)=>{
            if(err){
                res.status(400).json({
                    message: err
                })
            }
            
            res.status(200).json({
                message: "Success"
            })
        })
    }
})



router.get('/profile', authenticate, async function(req, res) {
    try {
        const { userId } = req.session;
        var user = await User.findById({ _id: userId });
        Book.find({owner: user.email}, function(err, books){
            Book.find({checker: user.email}, function(err, checked){
                res.render('profile', { user, books, checked });
            })
            
        })
        
    } catch (err) {
        res.status(401).render('login', {error: err.message})
    }
})

module.exports = router;