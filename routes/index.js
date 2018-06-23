var express = require('express');
var router = express.Router();
var path = require('path');
var config = require('../config');
const bcrypt = require('bcryptjs');



const notifier = require('node-notifier');

var mysql = require('mysql')

function db(){
var connection = mysql.createConnection({
  host: MY_HOST,
  port: MY_PORT,
  user: MY_USER,
  password: MY_PASSWORD,
  database: MY_DATABASE,
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

router.post('/delete', function(req,res){
  var connection = db();
  connection.query("DELETE FROM whiteboards WHERE whiteboardname = ?", req.body.drawingName, function(err,results){
    console.log(req.body.drawingName);
  })
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

          connection.query("INSERT INTO whiteboards SET ?", newDraw, function(err, res){
            console.log("Inserted new drawing")
          })
        } else {
          // UPDATE -overwrite old drawing
          var newDraw = [req.body.whiteboardlines, req.body.drawingName];
          connection.query("UPDATE whiteboards SET whiteboardlines = ? WHERE whiteboardname = ?", newDraw, function(err, res){
            console.log("updated")

          })
        }
      })

  }
  res.render('index');
})

// get login page
router.get('/login', function(req, res, next){
  console.log("getting login")
  if(sess){
    sess = null;
    req.session.destroy();
    notifier.notify({
      title: 'Status',
      message: 'Logged out!'
    })
  }
  res.render('login');

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

  } else if (!req.body.password){
    notifier.notify({
      title: 'Error',
      message: 'Must enter a password'
    })
    return res.render('login');

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

      } else {
        // found the username, check that the password matches
          bcrypt.compare(req.body.password, results[0]['password'], function(err, result) {
            if(!result){
              notifier.notify({
                title: 'Error',
                message: 'Wrong password'
              })
              return res.render('login');

            } else {
              sess = req.session;
              sess.username = req.body.username;
              sess.userId = results[0]['userid'];

              return res.redirect('/')
            }
          });
      }
    })
});
// get change password page
router.get('/change', function(req, res, next) {
  return res.render('change');

});

// get change password page
router.post('/change', function(req, res, next) {
  //check they filled in all fields
  if (!req.body.username || !req.body.oldPassword || !req.body.newPassword || !req.body.confirmation){
    notifier.notify({
      title: 'Error',
      message: 'Please fill in all fields'
    });
    return res.render('change');
  }
  //check new password and confirmation are the same
  if (req.body.newPassword != req.body.confirmation){
    notifier.notify({
      title: 'Error',
      message: 'New password and confirmation must match'
    });
    return res.render('change');
  }
  // check username exists
  var connection = db();
  connection.query("SELECT * FROM users WHERE username = ?", req.body.username, function(err,result){
    if(!result.length){
      notifier.notify({
        title: 'Error',
        message: 'Cannot find that username in our system'
      });
      return res.render('change');
    }

    //check old password matches Username
      bcrypt.compare(req.body.oldPassword, result[0]['password'], function(err, result) {
        if(!result){
          notifier.notify({
            title: 'Error',
            message: 'Wrong password'
          })
          return res.render('change');

        } else {
          //change the password to newPassword
          // encrypt password, UPDATE password field
          bcrypt.hash(req.body.newPassword, 8, function(err, hash) {
            var updateUser = [hash, req.body.username]
            connection.query("UPDATE users SET password = ? WHERE username= ?", updateUser, function(err, results){
              notifier.notify({
                title: 'Success!',
                message: 'Password changed'
              })
              return res.redirect('login')
            })
          });
        }
      });
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
    return res.render('register')
  } else if (!req.body.password){
    notifier.notify({
      title: 'Error',
      message: 'Must provide a password'
    });
    return res.render('register')
  } else if (!req.body.confirm){
    notifier.notify({
      title: 'Error',
      message: 'Must provide a password confirmation'
    });
    return res.render('register')
  //pasword and confirmation don't match
  } else if (req.body.password != req.body.confirm){
    notifier.notify({
      title: 'Error',
      message: 'Password and confirmation do not match'
    });
    return res.render('register')
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
            return res.render('register')
          }
      })
  }
});

module.exports = router;
