$(document).ready(function(){
  makeCanvas();
  // set the colour of button icon
  $('.colour').each(function(){
    colour = $(this).attr('data-value');
    if (colour != "white"){
      $(this).css('color', colour);
    }
    colour = 'black';
  })

  // set colour variable to whatever button was clicked
  $('.colour').on("click", function(event){
      colour = $(this).attr('data-value');
      console.log(colour);
   });

   function checkWidth(){
     if ($( document ).width() <= 600){
       canvas.width = 300;
     } else if ($( document ).width() <= 800){
       canvas.width = 500;
     } else if ($( document ).width() <= 900){
       canvas.width = 600;
     } else {
       canvas.width = 800;
     }
   }

   checkWidth();

   $( window ).resize(function() {
     checkWidth();
     redraw();
   });
  //Listeners
  document.addEventListener("mousedown", function(){
      if (canDraw){
        mouseDown = true;
      }
      //saveCoords();
  });

  document.addEventListener("mouseup", function(){
      mouseDown = false;
      if (savedCoords.length == 1){
        // being and end path so each line is a separate entity
        context.beginPath();
        context.fillStyle=colour;
        context.fillRect(savedCoords[0][0], savedCoords[0][1], penWidth, penWidth);
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

  //if a coord is not directly next to another (the x or y), draw a direct line between them

});

function makeCanvas(){
  // initialise the canvas and set its height/width
  canvas = document.getElementById("board");
  canvas.width = 800;
  canvas.height = 400;
  context = canvas.getContext("2d");
  document.getElementById('board').draggable = false;
}
var canvas;
var context;

// variables to store coordinates and pen details
var x;
var y;
var colour = 'black';
var penWidth = 5;
var opacity = 1.0;

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

function enterBox(){
  canDraw = true;
}
//called on mouseleave
function exitBox(){
  canDraw = false;
}

function highlighter(){
  console.log("pen width to 7");
  penWidth = 15;
  opacity =  0.3;
}

function marker(){
  penWidth = 5;
  opacity = 1.0;
}

function pencil(){
  penWidth = 2;
  opacity = 1.0;
}

// array to store coordinates mouse moved over while clicked
var savedCoords = [];
// save line coords, colour and pen style
var savedLines = [];

// called when user clicks on board
function saveCoords(){
  if (canDraw && mouseDown){
      //push coordinates to array
      thisCoord = [x,y]
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
  //console.log(savedLines);
  //console.log(savedLines[0]['colour']);
  // loop through lines from last object towards beginning
  // splice result off array until you reach a 0.
  //pop off zero at the end so you are on an object

  if (savedLines[savedLines.length -1 ] == 0){
    savedLines.splice(savedLines.length - 1, 1);
  }
  // make a copy to loop over to preserve length while splicing
  var copy = savedLines.slice(0);

  for (let i = 0; i < copy.length; i++){
    //loop through popping off objects until you find a 0
    if (savedLines[savedLines.length-1] == 0){
      break;
    } else {
      savedLines.splice(savedLines.length - 1, 1);
    }
  }

  // draw the canvas agasin
  redraw();
}

function clickedClear(){
  //remove saved lines only if clear all clicked
  // otherwise clearing before redrawing on undo will break
  savedLines = [];
  clearAll();
}
// clear the canvas
function clearAll(){
  context.clearRect(0, 0, canvas.width, canvas.height);
}

function redraw(){
  //clear the canvas before re-drawing it
  clearAll();
  // set colour and width based on first object, skip 0
  //draw until you reach a 0
  //if first is a 0, remove it - this should move inside the whole loop
  for (let i = 0; i < savedLines.length - 1; i++){
    if (savedLines[i] == 0){
      continue;
    } else {
      colour = savedLines[i]['colour'];
      penWidth = savedLines[i]['penWidth'];
      opacity = savedLines[i]['opacity'];
      setStyle();
      
      context.beginPath();
      context.moveTo(savedLines[i]['x'], savedLines[i]['y']);
      context.lineTo(savedLines[i+1]['x'],savedLines[i+1]['y']);
      context.stroke();
      context.closePath();
    }
  }
}

function setStyle(){
  context.strokeStyle=colour;
  context.lineWidth=penWidth;
  context.globalAlpha=opacity;
}

function drawLine(){

  //loop through the array of coordinates and connect them with a line if they are not directly next to each other
  for (let i = 0; i < savedCoords.length-1; i++){
    if (savedCoords.length > 1) {

      // if x is not directly next to x, or y not next to y
      if ((savedCoords[i][0] != savedCoords[i+1][0]+1) || (savedCoords[i][1] != savedCoords[i+1][1]+1)){
        // set start and end, draw line between them
        context.beginPath();
        context.moveTo(savedCoords[i][0],savedCoords[i][1]);
        context.lineTo(savedCoords[i+1][0],savedCoords[i+1][1]);
        context.strokeStyle=colour;
        context.lineWidth=penWidth;
        context.globalAlpha=opacity;
        context.stroke();
        context.closePath();
      }
    }
  }
}
