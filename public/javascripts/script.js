$(document).ready(function(){

  //window.history.pushState("", "", '/');
  //set up canvas
  makeCanvas();

  // set the colour of button icons
  $('.colour').each(function(){
    colour = $(this).attr('data-value');
    if (colour != "white"){
      $(this).css('color', colour);
    }
    // reset pen colour to black once done
    colour = 'black';
  })

  // set colour variable to whatever button was clicked
  $('.colour').on("click", function(event){
      if (penWidth == 5 && colour == 'white'){
        // prevent user from colouring with eraser
        $('.palette').css('background-color', 'white');
        return 0;
      }
      colour = $(this).attr('data-value');
      $('.palette').css('background-color', 'white');
      $(this).css('background-color', '#bdbdbd');
   });

   // when user saves, post
   $('#saving').on('click', function(event){
     event.preventDefault();
     data= {};
     data.drawingName = $("#drawingName").val()
     data.whiteboardlines = JSON.stringify(savedLines);
     $.ajax({
       url: '/',
       type: 'POST',
       contentType: "application/json",
       data: JSON.stringify(data),
       success: function(data) {
         console.log('form submitted.');

       },
       error: function(data){
         console.log("whoops, went wrong")
       }
     });
     //close modal when done
     $('#saveModal').modal('toggle');
   })
   // when user clicks open,
   $('#open').on('click', function(event){

     event.preventDefault();
     $.ajax({
       url: '/open',
       type: 'GET',
       contentType: "application/json",
       success: function(data){
         if (!data.rows.length){
           $('#drawings').html("<p>No saved drawings</p>");
         } else {
           //dynamically create buttons based on drawings returned from db
           var string = "<ul>"
           for (let i = 0; i < data.rows.length; i++){
             var myObj = data.rows[i].whiteboardlines
             string += "<li><button class='savedDrawings' data-value='"+ myObj + "'>"+ data.rows[i].whiteboardname + '</button></li>';
           }
           string += "</ul>"
           $('#drawings').html(string);
         }
       }
     })
     $('#openModal').modal('toggle');
   })

   //when user clicks on a drawing in open modal, redraw that drawing
   //TO DO: ALSO UPDATE SESSION CURRENT DRAWING?
   $(document).on("click", '.savedDrawings', function(event){
     event.preventDefault();
     toDelete = $(this).text();
     savedLines = $(this).data('value');
     redraw();
     //reset pen after drawing
     colour = "black";
     marker("pen");
     //close modal after loading image
     $('#openModal').modal('toggle');
     console.log("modeal should be closed now?")
   })

   // when user confirms delete, clear the board
   // TO DO: ALSO DELETE FROM DATABASE IF LOGGED IN
   $('#deleting').on('click', function(event){
     if (toDelete){
       data={}
       data.drawingName = toDelete;
       $.ajax({
         url: '/delete',
         type: 'POST',
         contentType: "application/json",
         data: JSON.stringify(data),
         success: function(data) {
           console.log('form submitted.');

         },
         error: function(data){
           console.log("whoops, went wrong")
         }
       });
       toDelete = null;
     }

     clickedClear("trash");
     $('#deleteModal').modal('toggle');
     //AJAX post, DELETE
   })


   // resize canvas based on browser adjustments
   function checkWidth(){
     if ($( document ).width() <= 400){
       canvas.width = 200;
     } else if ($( document ).width() <= 600){
       canvas.width = 300;
     } else if ($( document ).width() <= 800){
       canvas.width = 500;
     } else if ($( document ).width() <= 900){
       canvas.width = 600;
     } else {
       canvas.width = 800;
     }
   }
   // check the browser width on load
   checkWidth();
   // check the browser with on resize
   $( window ).resize(function() {
     checkWidth();
     redraw();
   });
   // set decoration for black pen button selected on start
   $('#marker').css('background-color', '#bdbdbd');
   $('.colour[data-value="black"]').css('background-color', '#bdbdbd');

  //Listeners
  document.addEventListener("mousedown", function(){
      if (canDraw){
        mouseDown = true;
      }
      saveCoords();
  });

  document.addEventListener("mouseup", function(){
      mouseDown = false;
      if (savedCoords.length == 1){
        // fall back in case only 1 coord in array (a single dot)
        context.beginPath();
        context.fillStyle=colour;
        context.fillRect(savedCoords[0]['x'], savedCoords[0]['y'], penWidth, penWidth);
        context.closePath();
      }
      savedCoords = [];

    // push a 0 to mark where one line ends and next begins
    // ignore mouseUp where the user is not drawing
    if (canDraw && savedLines[savedLines.length - 1] != 0){
      savedLines.push(0);
    }
  });

  window.addEventListener('mousemove', saveCoords);

});

// initialise the canvas and set its height/width
function makeCanvas(){
  canvas = document.getElementById("board");
  canvas.width = 800;
  canvas.height = 400;
  context = canvas.getContext("2d");
  document.getElementById('board').draggable = false;
}
// variables to store canvas details
var canvas;
var context;

// variables to store coordinates and pen details
var x;
var y;
var colour = 'black';
var penWidth = 5;
var opacity = 1.0;
// copies of colour and width to keep track while undoing
var c;
var w;

var toDelete;
// true when inside canvas
var canDraw = false;
var mouseDown = false;

// mouse coordinates on page (by pixel)
function getCoords(event){
  // size is where the canvas is in the page
  var size = canvas.getBoundingClientRect();
  /* clientX/Y are the pixel positions of mouse in page
  For horizontal/x, minus the left offset to get back to 0
  e.g. mouse pos in page is 10,0 while in top left corner of canvas
  We want it at 0,0 (pos in canvas, not page),
  so we minus the gap between page left and canvas start
  which here would be 10 */
  x = (event.clientX - size.left);
  y = (event.clientY - size.top);
}

// called on mouseenter
function enterBox(){
  canDraw = true;
}
//called on mouseleave
function exitBox(){
  canDraw = false;
}

function highlighter(){
  $(".action").css('background-color', 'white');
  $('#highlighter').css('background-color', '#bdbdbd');
  penWidth = 15;
  opacity =  0.3;
  if (colour == 'white'){
    colour = 'black';
    $('.palette').css('background-color', 'white');
    $('.colour[data-value="black"]').css('background-color', '#bdbdbd');
  }
}

function marker(pen){
  $(".action").css('background-color', 'white');
  penWidth = 5;
  opacity = 1.0;

  $('.palette').css('background-color', 'white');
  if (pen == 'eraser'){
    $('#eraser').css('background-color', '#bdbdbd');
    colour = 'white';
  } else {
    // on marker selection, keep previous colour unless white
    if (colour == "white"){
      colour = 'black';
      $('.colour[data-value="black"]').css('background-color', '#bdbdbd');
    }

    $('.colour[data-value=' + colour + ']').css('background-color', '#bdbdbd');
    $('#marker').css('background-color', '#bdbdbd');

  }
}

function pencil(){
  $(".action").css('background-color', 'white');
  $('#pencil').css('background-color', '#bdbdbd');
  penWidth = 2;
  opacity = 1.0;
  if (colour == 'white'){
    colour = 'black';
    $('.colour[data-value="black"]').css('background-color', '#bdbdbd');
  }
}


// array to store coordinates mouse moved over while clicked
var savedCoords = [];
// save line coords, colour and pen style
var savedLines = [];

// called when user clicks on board
function saveCoords(){
  if (canDraw && mouseDown){
      //push coordinates to array
      thisCoord = {'x': x, 'y': y};
      savedCoords.push(thisCoord);
      savedLines.push({'x': x, 'y': y, 'colour': colour, 'penWidth': penWidth, 'opacity': opacity});
      if (savedCoords.length > 2){
        savedCoords.splice(0,1);
      }
      drawLine();
   }
}

// on undo, take last move and remove it from array
// clear entire board, then redraw again from array (that is now missing the last move)
function undo(){
  //save whatever the last move was
  c = colour;
  w = penWidth;
  // make undo button flash
  $('#undo').css('background-color', '#bdbdbd');
  setTimeout(function(){
    $('#undo').css('background-color', 'white');
  }, 300);

  //pop off zero at the end so you are on an object
  if (savedLines[savedLines.length -1 ] == 0){
    savedLines.splice(savedLines.length - 1, 1);
  }
  // make a copy to loop over to preserve length while splicing
  var copy = savedLines.slice(0);
  //loop through popping off objects until you find a 0
  for (let i = 0; i < copy.length; i++){
    if (savedLines[savedLines.length-1] == 0){
      break;
    } else {
      savedLines.splice(savedLines.length - 1, 1);
    }
  }
  // draw the canvas again
  redraw();
}

function clickedClear(trash){
  //remove saved lines only if clear all clicked
  // otherwise clearing before redrawing on undo will break
  if (trash == "trash"){
    $('#trash').css('background-color', '#bdbdbd');
    setTimeout(function(){
      $('#trash').css('background-color', 'white');
    }, 300);
  }

  savedLines = [];
  clearAll();
}
// clear the canvas
function clearAll(){
  context.clearRect(0, 0, canvas.width, canvas.height);
}

// redraws board
function redraw(){
  //clear the canvas before re-drawing it
  clearAll();
  //if first is a 0, remove it - this should move inside the whole loop
  for (let i = 0; i < savedLines.length - 1; i++){
    if (savedLines[i] == 0){
      continue;
    } else {
      // set colour/width to current line settings
      colour = savedLines[i]['colour'];
      penWidth = savedLines[i]['penWidth'];
      opacity = savedLines[i]['opacity'];
      draw(savedLines, i);
    }
  }
  // once done redrawing/undoing, set pen to whatever was saved before undo
  colour = c;
  if (colour == "white"){
    marker("eraser");
  } else {
    $('.palette').css('background-color', 'white');
    $('.colour[data-value=' + colour + ']').css('background-color', '#bdbdbd');
    if (w == 5){
      marker("pen");
    } else if (w == 15){
      highlighter();
    } else {
      pencil();
    }
  }
}

// draws line while pen is moving
function drawLine(){
  //loop through the array of coordinates and connect them with a line if they are not directly next to each other
  for (let i = 0; i < savedCoords.length-1; i++){
    if (savedCoords.length > 1) {
      // if x is not directly next to x, or y not next to y
      if ((savedCoords[i][0] != savedCoords[i+1][0]+1) || (savedCoords[i][1] != savedCoords[i+1][1]+1)){
        // set start and end, draw line between them
        draw(savedCoords , i);
      }
    }
  }
}

function draw(array, i){
  //set style
  context.strokeStyle=colour;
  context.lineWidth=penWidth;
  context.globalAlpha=opacity;
  // draw line between given points
  context.beginPath();
  context.moveTo(array[i]['x'],array[i]['y']);
  context.lineTo(array[i+1]['x'],array[i+1]['y']);
  context.stroke();
  context.closePath();
}
