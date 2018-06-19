var express = require('express');
var router = express.Router();
var path = require('path');
var config = require('../config');

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


//registering users
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;





/* GET home page. */
router.get('/', function(req, res, next) {
  res.sendFile(path.join(__dirname + '/../views/whiteboard.html'))
});


router.get('/login', function(req, res, next) {
  res.sendFile(path.join(__dirname + '/../views/login.html'))

});



router.get('/register', function(req, res, next) {
  res.sendFile(path.join(__dirname + '/../views/register.html'))
});


router.post('/register', function(req, res, next) {
  //santise input
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
            var newUser = {username: req.body.username, password: req.body.password}

              connection.query("INSERT INTO users SET ?", newUser, function(err, results){
                console.log("added a user to users")
                console.log(results)
                return res.redirect('/')
                //return res.sendFile(path.join(__dirname + '/../views/whiteboard.html'))
            })

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
