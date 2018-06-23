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

var sess;

router.get('/open', function(req,res){
  var connection = db();
  connection.query("SELECT * FROM whiteboards WHERE userId = ?", sess.userId, function(err, results){

    res.send({user: sess.username, userId: sess.userId, rows: results});
  })
})

/* GET home page. */
router.get('/', function(req, res) {

  if (!sess){
    res.render('index');
  } else {
    //set the user details for homepage based on logged in user
    var connection = db();
    connection.query("SELECT whiteboardname FROM whiteboards WHERE userId = ?", sess.userId, function(err, results){
      res.render('index', {user: sess.username, userId: sess.userId});
    })
  }
})


// user saves drawing
router.post('/', function(req, res){
  // get name of drawing from form
  if(!req.body.drawingName){
    notifier.notify({
      title: 'Could not save',
      message: 'Must enter a drawing name'
    })
    res.render('index');
  } else {

    var connection = db();
    connection.query("SELECT * FROM whiteboards WHERE userid= ? AND whiteboardname = ?", [sess.userId,req.body.drawingName],
      function(err, results){
        if(!results.length){
          // INSERT new drawing into whiteboard database
          var newDraw = {userid: sess.userId, whiteboardname: req.body.drawingName, whiteboardlines: req.body.whiteboardlines};
          console.log(newDraw);
          connection.query("INSERT INTO whiteboards SET ?", newDraw, function(err, res){
            console.log("Inserted new drawing")
          })
        } else {
          // UPDATE -overwrite old drawing
          var newDraw = [req.body.whiteboardlines, req.body.drawingName];
          connection.query("UPDATE whiteboards SET whiteboardlines = ? WHERE whiteboardname = ?", newDraw, function(err, res){
            console.log("updated")
            console.log(newDraw)
          })
        }
      })

  }
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
              sess = req.session;
              sess.username = req.body.username;
              sess.userId = results[0]['userid'];

              //console.log(sessData.username);

              //return res.render('index', {user: sess.username})
              return res.redirect('/')
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
