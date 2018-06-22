var express = require('express');
var router = express.Router();
var path = require('path');
var config = require('../config');
const bcrypt = require('bcryptjs');


const notifier = require('node-notifier');

var mysql = require('mysql')

function db(){
var connection = mysql.createConnection({
  host: config.MY_HOST,
  port: config.MY_PORT,
  user: config.MY_USER,
  password: config.MY_PASSWORD,
  database: config.MY_DATABASE,
  multipleStatements:true
})
return connection;
}

/* GET home page. */
router.get('/', function(req, res) {
  console.log("getting")

  var username = req.session.username;
  console.log(username);
  //if (req.name == "open"){
//    console.log("they opened")
  //}
  //res.sendFile(path.join(__dirname + '/../views/whiteboard.html'))
  res.render('index');
});


// user saves drawing
router.post('/', function(req, res){
  // get name of drawing from form
  console.log(req.body.drawingName);
  console.log(req.body.lines);
  //console.log(req.body.lines);
  //check if name already in database
  // if yes, UPDATE, else INSERT

  // get drawlines function response and save as JSON
  console.log("recieved the save")
  //console.log(req.lines)
  res.render('index');
})

// get login page
router.get('/login', function(req, res, next){
  res.render('login');
  //res.sendFile(path.join(__dirname + '/../views/login.html'));
});

//submit login
router.post('/login', function(req, res, next) {

  // check user entered name and Password
  if (!req.body.username){
    notifier.notify({
      title: 'Error',
      message: 'Must enter a username'
    })
    return res.render('login');
    //return res.sendFile(path.join(__dirname + '/../views/login.html'))
  } else if (!req.body.password){
    notifier.notify({
      title: 'Error',
      message: 'Must enter a password'
    })
    return res.render('login');
    //return res.sendFile(path.join(__dirname + '/../views/login.html'))
  }
  // if username exists
  var connection = db();
  connection.query("SELECT * FROM users WHERE username = ?", req.body.username,
    function(err, results){
      // if you can't find the username
      if (!results.length){
        notifier.notify({
          title: 'Error',
          message: 'No account exists under that username'
        })
        return res.render('login');
        //return res.sendFile(path.join(__dirname + '/../views/login.html'))
      } else {
        // found the username, check that the password matches
          bcrypt.compare(req.body.password, results[0]['password'], function(err, result) {
            if(!result){
              notifier.notify({
                title: 'Error',
                message: 'Wrong password'
              })
              return res.render('login');
              //return res.sendFile(path.join(__dirname + '/../views/login.html'))
            } else {
              var sessData = req.session;
              sessData.username = req.body.username;

              //console.log(sessData.username);

              return res.render('index', {user: req.session.username})
              //return res.redirect('/')
            }
          });
      }
    })
});

// get register page
router.get('/register', function(req, res, next) {
  return res.render('register');
  //res.sendFile(path.join(__dirname + '/../views/register.html'))
});

// submit register page
router.post('/register', function(req, res, next) {
  // santise input
  if (!req.body.username){
    notifier.notify({
      title: 'Error',
      message: 'Must Provide a username'
    });
  } else if (!req.body.password){
    notifier.notify({
      title: 'Error',
      message: 'Must provide a password'
    });
  } else if (!req.body.confirm){
    notifier.notify({
      title: 'Error',
      message: 'Must provide a password confirmation'
    });
  //pasword and confirmation don't match
  } else if (req.body.password != req.body.confirm){
    notifier.notify({
      title: 'Error',
      message: 'Password and confirmation do not match'
    });
  } else {
    var connection = db();
    // check if username is taken
      connection.query("SELECT * FROM users WHERE username = ?", req.body.username,
        function(err, results) {
          if (!results.length){
            // encrypt password
            bcrypt.hash(req.body.password, 8, function(err, hash) {
              var newUser = {username: req.body.username, password: hash}
              connection.query("INSERT INTO users SET ?", newUser, function(err, results){
                return res.redirect('/login')
              })
            });
          } else {
            notifier.notify({
              title: 'Error',
              message: 'Username is already taken'
            });
          }
      })
  }
});

module.exports = router;
