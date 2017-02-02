// 
// EECS 351 Project A 
// David Wallach -- netID: daw647
// Winter 2017
// 

// declare vertex shader
var VSHADER_SOURCE = 
  'uniform mat4 u_ModelMatrix;\n' +
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_ModelMatrix * a_Position;\n' +
  '  gl_PointSize = 10.0;\n' +
  '  v_Color = a_Color;\n' +
  '}\n';


  // declare fragment shader
var FSHADER_SOURCE = 
  'precision mediump float;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

//initial onload function
// Global Variables for the spinning tetrahedron:
var ANGLE_STEP = 45.0;  // default rotation angle rate (deg/sec)
var currentAngle_2 = ANGLE_STEP * 2.1;

// Global vars for mouse click-and-drag for rotation.
var isDrag=false;		// mouse-drag: true when user holds down mouse button
var doRobot=false;
var feet=false;
var sKey=false;
var freeze=false;
var setClick=false;
var rand_x = 0.0;
var rand_y = 0.0;
var xMclik=0.0;			// last mouse button-down position (in CVV coords)
var yMclik=0.0;   
var xMdragTot=0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var yMdragTot=0.0;  
var upwards = true;
var downwards = false;

function main() {

  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Initialize a Vertex Buffer in the graphics system to hold our vertices
  var n = initVertexBuffer(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

    // Get handle to graphics system's storage location of u_ModelMatrix
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) { 
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  var modelMatrix = new Matrix4();
  var currentAngle = 0.0;

  // First, register all mouse events found within our HTML-5 canvas:
  canvas.onmousedown  = function(ev){myMouseDown( ev, gl, canvas, n, currentAngle, modelMatrix, u_ModelMatrix) }; 
  
  // when user's mouse button goes down call mouseDown() function
  canvas.onmousemove =  function(ev){myMouseMove( ev, gl, canvas) };
  
  // call mouseMove() function          
  canvas.onmouseup =    function(ev){myMouseUp(   ev, gl, canvas)};

  window.addEventListener("keydown", myKeyDown, false);
  window.addEventListener("keyup", myKeyUp, false);
  window.addEventListener("keypress", myKeyPress, false);


  var button = document.getElementById("robotButton");
  button.onclick = function() {
      if(doRobot){
        button.innerHTML="Do the Robot";
        doRobot = false;
        console.log("doRobot is false now");
      } else{
        button.innerHTML = "Stop the Robot";
        console.log("doRobot is true now");
        doRobot = true;
      }
  }

  var button2 =  document.getElementById("freezeButton");
  button2.onclick = function() {
     if(freeze){
      freeze = false;
      console.log("freeze is false");
      button2.innerHTML = "Freeze";
     } else { 
      freeze = true;
      console.log("freeze is true");
      button2.innerHTML="Unfreeze";
     }
  }

  setClearColor(gl);
  gl.clearColor(0.75, 0.85, 0.8, 1.0);

  var tick = function() {

    currentAngle = animate(currentAngle);
    draw(gl, n, currentAngle, modelMatrix, u_ModelMatrix);   // Draw shapes
    drawRobotArms(gl, n, currentAngle, modelMatrix, u_ModelMatrix); // Draw robot 
    if(feet){
      drawCubeFeet(gl, n, currentAngle, modelMatrix, u_ModelMatrix);
    }
    if(setClick){
      // console.log("penetrated mainframe");
      drawRandomCube(gl, n, currentAngle, modelMatrix, u_ModelMatrix);
    }
    drawHex(gl, n, currentAngle, modelMatrix, u_ModelMatrix);
    // drawPyramid(gl, n, currentAngle, modelMatrix, u_ModelMatrix);

    requestAnimationFrame(tick, canvas);   // Request that the browser re-draw the webpage
    									// (causes webpage to endlessly re-draw itself)
  };
  requestAnimationFrame(tick, canvas);   // Request that the browser re-draw the webpage
  tick();							// start (and continue) animation: draw current image
}

function initVertexBuffer(gl) {
//==============================================================================
	var c30 = Math.sqrt(0.75);					// == cos(30deg) == sqrt(3) / 2
	var sq2	= Math.sqrt(2.0);

    var n_0_color = Math.random();
    var n_1_color = Math.random();
    var n_2_color = Math.random();
    var n_3_color = Math.random();


  var vertices = new Float32Array([

	/*****   Tetrahedron  ******/
	// Face` 0: (left side)  
     0.0, 0.0, sq2, 1.0,		1.0,  0.0,  0.0,	// Node 0
     c30, -0.5, 0.0, 1.0, 		0.0,  0.3,  0.2, 	// Node 1
     0.0,  1.0, 0.0, 1.0,  		1.0,  1.0,  0.0,	// Node 2
	// Face 1: (right side)
	    0.0,  0.0, sq2, 1.0,		1.0,  0.0,	0.0,	// Node 0
     0.0,  1.0, 0.0, 1.0,  		1.0,  1.0,  0.0,	// Node 2
    -c30, -0.5, 0.0, 1.0, 		0.0,  1.0,  0.2, 	// Node 3
    	// Face 2: (lower side)
	   0.0,   0.0, sq2, 1.0,		1.0,  0.0,  1.0,	// Node 0 
    -c30, -0.5, 0.0, 1.0, 		0.0,  1.0,  0.2, 	// Node 3
     c30, -0.5, 0.0, 1.0, 		1.0,  0.3,  0.2, 	// Node 1 
     	// Face 3: (base side)  
    -c30, -0.5,  0.0, 1.0, 		0.0,  1.0,  0.2, 	// Node 3
     0.0,  1.0,  0.0, 1.0,  	1.0,  1.0,  0.0,	// Node 2
     c30, -0.5,  0.0, 1.0, 		1.0,  0.3,  0.2, 	// Node 1


     /*****   Robot Body  ******/
     0.00, 0.00, 0.00, 1.00,		1.0, 0.3, 0.2, // first triangle   (x,y,z,w==1) (R,G,B)
     0.19, 0.00, 0.00, 1.00,  		1.0, 0.3, 0.2,
     0.0,  0.49, 0.00, 1.00,		1.0, 0.3, 0.2,

     0.20, 0.01, 0.00, 1.00,		1.0, 0.3, 0.2,	// second triangle
     0.20, 0.50, 0.00, 1.00,		1.0, 0.3, 0.2,
     0.01, 0.50, 0.00, 1.00,		1.0, 0.3, 0.2, 
     

     /*****   Robot Arms  ******/
     0.00, 0.00, 0.00, 1.00,		1.0, 0.3, 0.2, // first triangle   (x,y,z,w==1) (R,G,B)
     0.49, 0.00, 0.00, 1.00,  		1.0, 0.3, 0.2,
     0.00,  0.19, 0.00, 1.00,		1.0, 0.3, 0.2,

     0.5, 0.02, 0.00, 1.00,			1.0, 0.3, 0.2,	// second triangle
     0.5, 0.20, 0.00, 1.00,		1.0, 0.3, 0.2,
     0.01, 0.2, 0.00, 1.00,			1.0, 0.3, 0.2, 

     // 
     // 
     /*****   Cube ******/
     // 

     // +x face: RED
     1.0, -1.0, -1.0, 1.0,    0.0, 1.0, 0.2,  // Node 3
     1.0,  1.0, -1.0, 1.0,    1.0, 1.0, 0.0,  // Node 2
     1.0,  1.0,  1.0, 1.0,    0.6, 0.1, 0.7,  // Node 4
     
     1.0,  1.0,  1.0, 1.0,    0.6, 0.1, 0.7,  // Node 4
     1.0, -1.0,  1.0, 1.0,    0.0, 0.0, 0.0,  // Node 7
     1.0, -1.0, -1.0, 1.0,    0.0, 1.0, 0.2,  // Node 3

    // +y face: GREEN
    -1.0,  1.0, -1.0, 1.0,    1.0, 0.3, 0.2,  // Node 1
    -1.0,  1.0,  1.0, 1.0,    0.0, 0.4, 1.0,  // Node 5
     1.0,  1.0,  1.0, 1.0,    0.6, 0.1, 0.7,  // Node 4

     1.0,  1.0,  1.0, 1.0,    0.6, 0.1, 0.7,  // Node 4
     1.0,  1.0, -1.0, 1.0,    1.0, 1.0, 0.0,  // Node 2 
    -1.0,  1.0, -1.0, 1.0,    1.0, 0.3, 0.2,  // Node 1

    // +z face: BLUE
    -1.0,  1.0,  1.0, 1.0,    0.0, 0.4, 1.0,  // Node 5
    -1.0, -1.0,  1.0, 1.0,    0.2, 0.3, 0.1,  // Node 6
     1.0, -1.0,  1.0, 1.0,    0.0, 0.0, 0.0,  // Node 7

     1.0, -1.0,  1.0, 1.0,    0.0, 0.0, 0.0,  // Node 7
     1.0,  1.0,  1.0, 1.0,    0.6, 0.1, 0.7,  // Node 4
    -1.0,  1.0,  1.0, 1.0,    0.0, 0.4, 1.0,  // Node 5

    // -x face: CYAN
    -1.0, -1.0,  1.0, 1.0,    0.2, 0.3, 0.1,  // Node 6 
    -1.0,  1.0,  1.0, 1.0,    0.0, 0.4, 1.0,  // Node 5 
    -1.0,  1.0, -1.0, 1.0,    1.0, 0.3, 0.2,  // Node 1
    
    -1.0,  1.0, -1.0, 1.0,    1.0, 0.3, 0.2,  // Node 1
    -1.0, -1.0, -1.0, 1.0,    1.0, 0.0, 0.0,  // Node 0  
    -1.0, -1.0,  1.0, 1.0,    0.2, 0.3, 0.1,  // Node 6  
    
    // -y face: MAGENTA
     1.0, -1.0, -1.0, 1.0,    0.0, 1.0, 0.2,  // Node 3
     1.0, -1.0,  1.0, 1.0,    0.0, 0.0, 0.0,  // Node 7
    -1.0, -1.0,  1.0, 1.0,    0.2, 0.3, 0.1,  // Node 6

    -1.0, -1.0,  1.0, 1.0,    0.2, 0.3, 0.1,  // Node 6
    -1.0, -1.0, -1.0, 1.0,    1.0, 0.0, 0.0,  // Node 0
     1.0, -1.0, -1.0, 1.0,    0.0, 1.0, 0.2,  // Node 3

     // -z face: YELLOW
     1.0,  1.0, -1.0, 1.0,    1.0, 1.0, 0.0,  // Node 2
     1.0, -1.0, -1.0, 1.0,    0.0, 1.0, 0.2,  // Node 3
    -1.0, -1.0, -1.0, 1.0,    1.0, 0.0, 0.0,  // Node 0   

    -1.0, -1.0, -1.0, 1.0,    1.0, 0.0, 0.0,  // Node 0
    -1.0,  1.0, -1.0, 1.0,    1.0, 0.3, 0.2,  // Node 1
     1.0,  1.0, -1.0, 1.0,    1.0, 1.0, 0.0,  // Node 2

  
     // 
     // 
     /****** DRAW HEXAGONAL PRYSM ********/
     // 
     // 

     /***** base (bottom) side ****/
     -1.0, 0.0, -1.0, 1.0,     1.0, 0.3, 0.2, // Node 1 
      0.0, 0.0, -1.0, 1.0,     1.0, 0.0, 0.0, // Node 0
     -0.5, 1.0, -1.0, 1.0,     1.0, 1.0, 0.0,  // Node 2 

     -0.5, 1.0, -1.0, 1.0,     1.0, 1.0, 0.0,  // Node 2 
      0.0, 0.0, -1.0, 1.0,     1.0, 0.0, 0.0, // Node 0
      0.5, 1.0, -1.0, 1.0,      0.0, 1.0, 0.2, // Node 3

      0.5, 1.0, -1.0, 1.0,      0.0, 1.0, 0.2, // Node 3
      0.0, 0.0, -1.0, 1.0,     1.0, 0.0, 0.0, // Node 0
      1.0, 0.0, -1.0, 1.0,      0.6, 0.1, 0.7, // Node 4

      1.0, 0.0, -1.0, 1.0,      0.6, 0.1, 0.7, // Node 4
      0.0, 0.0, -1.0, 1.0,      1.0, 0.0, 0.0, // Node 0
      0.5, -1.0, -1.0, 1.0,     0.0, 0.4, 1.0, // Node 5

      0.5, -1.0, -1.0, 1.0,      0.0, 0.4, 1.0, // Node 5
      0.0, 0.0, -1.0, 1.0,       1.0, 0.0, 0.0, // Node 0
      -0.5, -1.0, -1.0, 1.0,     0.2, 0.3, 0.1, // Node 6

       -0.5, -1.0, -1.0, 1.0,      0.2, 0.3, 0.1, // Node 6
       0.0, 0.0, -1.0, 1.0,      1.0, 0.0, 0.0, // Node 0
        -1.0, 0.0, -1.0, 1.0,     1.0, 0.3, 0.2, // Node 1 


      //connecting base to top right side (rectangle)
      0.5, 1.0, -1.0, 1.0,        0.0, 1.0, 0.2, //Node 3
      1.0, 0.0, -1.0, 1.0,        0.6, 0.1, 0.7, //Node 4
      0.5, 1.0, 1.0, 1.0,        0.3, 1.0, 0.8, //Node 10

      1.0, 0.0, 1.0, 1.0,        0.6, 0.4, 0.0, //Node 11
      0.5, 1.0, 1.0, 1.0,        0.3, 1.0, 0.8, //Node 10
      1.0, 0.0, -1.0, 1.0,        0.6, 0.1, 0.7, //Node 4

      //connecting base to top (top) side (rectangle)
      -0.5, 1.0, -1.0, 1.0,        1.0, 1.0, 0.0, //Node 2
      0.5, 1.0, -1.0, 1.0,        0.0, 1.0, 0.2, //Node 3
      -0.5, 1.0, 1.0, 1.0,        0.5, 1.0, 0.3, //Node 9

       0.5, 1.0, 1.0, 1.0,        0.3, 1.0, 0.8, //Node 10
      -0.5, 1.0, 1.0, 1.0,        0.5, 1.0, 0.3, //Node 9
      0.5, 1.0, -1.0, 1.0,        0.0, 1.0, 0.2, //Node 3

      //connecting base to top left side (rectangle)
     -1.0, 0.0, -1.0, 1.0,        1.0, 0.3, 0.2, //Node 1
      -0.5, 1.0, -1.0, 1.0,        1.0, 1.0, 0.0, //Node 2
      -1.0, 0.0, 1.0, 1.0,        1.0, 0.2, 1.0, //Node 8

       -0.5, 1.0, 1.0, 1.0,        0.5, 1.0, 0.3, //Node 9
      -1.0, 0.0, 1.0, 1.0,        1.0, 0.2, 1.0, //Node 8
      -0.5, 1.0, -1.0, 1.0,        1.0, 1.0, 0.0, //Node 2

      //connecting base to bottom left side (rectangle)
      -1.0, 0.0, -1.0, 1.0,        1.0, 0.3, 0.2, //Node 1
      -0.5, -1.0, -1.0, 1.0,        0.2, 0.3, 0.1, //Node 6
      -1.0, 0.0, 1.0, 1.0,        1.0, 0.2, 1.0, //Node 8

       -0.5, -1.0, 1.0, 1.0,        0.4, 1.0, 0.4, //Node 13
      -1.0, 0.0, 1.0, 1.0,          1.0, 0.2, 1.0, //Node 8
      -0.5, -1.0, -1.0, 1.0,        0.2, 0.3, 0.1, //Node 6


       //connecting base to bottom (bottom) side (rectangle)
     -0.5, -1.0, -1.0, 1.0,        0.2, 0.3, 0.1, //Node 6
      0.5, -1.0, -1.0, 1.0,        0.0, 0.4, 1.0, //Node 5
      -0.5, -1.0, 1.0, 1.0,        0.4, 1.0, 0.4, //Node 13

       0.5, -1.0, 1.0, 1.0,        1.0, 0.3, 0.7, //Node 12
      -0.5, -1.0, 1.0, 1.0,        0.4, 1.0, 0.4, //Node 13
      0.5, -1.0, -1.0, 1.0,        0.0, 0.4, 1.0, //Node 5

      
      //connecting base to bottom (right) side (rectangle)
      0.5, -1.0, -1.0, 1.0,        0.0, 0.4, 1.0, //Node 5
      1.0, 0.0, -1.0, 1.0,        0.6, 0.1, 0.7, //Node 4
      0.5, -1.0, 1.0, 1.0,        1.0, 0.3, 0.7, //Node 12

      1.0, 0.0, 1.0, 1.0,        0.6, 0.4, 0.0, //Node 11
      0.5, -1.0, 1.0, 1.0,        1.0, 0.3, 0.7, //Node 12
      1.0, 0.0, -1.0, 1.0,        0.6, 0.1, 0.7, //Node 4


       /***** TOP base side ****/
     -1.0, 0.0, 1.0, 1.0,     1.0, 0.2, 1.0, // Node 8 
      0.0, 0.0, 1.0, 1.0,     0.0, 0.0, 0.0, // Node 7
     -0.5, 1.0, 1.0, 1.0,     0.5, 1.0, 0.3,  // Node 9 

     -0.5, 1.0, 1.0, 1.0,     0.5, 1.0, 0.3,  // Node 9
      0.0, 0.0, 1.0, 1.0,     0.0, 0.0, 0.0, // Node 7
      0.5, 1.0, 1.0, 1.0,      0.3, 1.0, 0.8, // Node 10

      0.5, 1.0, 1.0, 1.0,      0.3, 1.0, 0.8, // Node 10
      0.0, 0.0, 1.0, 1.0,     0.0, 0.0, 0.0, // Node 7
      1.0, 0.0, 1.0, 1.0,      0.6, 0.4, 0.0, // Node 11

      1.0, 0.0, 1.0, 1.0,      0.6, 0.4, 0.0, // Node 11
      0.0, 0.0, 1.0, 1.0,     0.0, 0.0, 0.0, // Node 7
      0.5, -1.0, 1.0, 1.0,      1.0, 0.3, 0.7, // Node 12

      0.5, -1.0, 1.0, 1.0,      1.0, 0.3, 0.7, // Node 12
      0.0, 0.0, 1.0, 1.0,       0.0, 0.0, 0.0, // Node 7
      -0.5, -1.0, 1.0, 1.0,      0.4, 1.0, 0.4, // Node 13

       -0.5, -1.0, 1.0, 1.0,      0.4, 1.0, 0.4, // Node 13
       0.0, 0.0, 1.0, 1.0,       0.0, 0.0, 0.0, // Node 7
        -1.0, 0.0, 1.0, 1.0,     1.0, 0.2, 1.0, // Node 8 


        // 
        // 
        /***** DRAW PYRAMID *****/
        // 
        -1.0, 1.0, 0.0,         1.0, 0.0, 0.0, //Node 0
        -1.0, -1.0, 0.0,        1.0, 0.3, 0.2, // Node 1
        1.0, 1.0, 0.0,         0.0, 1.0, 0.2, // Node 3

         1.0, -1.0, 0.0,        1.0, 1.0, 0.0, // Node 2
        -1.0, -1.0, 0.0,        1.0, 0.3, 0.2, // Node 1
         1.0, 1.0, 0.0,         0.0, 1.0, 0.2, // Node 3

         -1.0, 1.0, 0.0,        1.0, 0.3, 0.2, // Node 1
         1.0, -1.0, 0.0,        1.0, 1.0, 0.0, // Node 2
         0.0, 0.0, 1.0,           0.6, 0.1, 0.7 // Node 4

          -1.0, 1.0, 0.0,         1.0, 0.0, 0.0, //Node 0
        -1.0, 1.0, 0.0,        1.0, 0.3, 0.2, // Node 1
        0.0, 0.0, 1.0,           0.6, 0.1, 0.7, // Node 4

        -1.0, 1.0, 0.0,         1.0, 0.0, 0.0, //Node 0
        1.0, 1.0, 0.0,         0.0, 1.0, 0.2, // Node 3
        0.0, 0.0, 1.0,           0.6, 0.1, 0.7, // Node 4
        
        1.0, 1.0, 0.0,         0.0, 1.0, 0.2, // Node 3
        1.0, -1.0, 0.0,        1.0, 1.0, 0.0, // Node 2
        0.0, 0.0, 1.0,           0.6, 0.1, 0.7, // Node 4
  ]);

  //var nn = 78;	// 12 tetrahedron, 6 horizontal robot, 6 vertical robot & 36 cube verticies
  var nn = 60 + 3*6 + 6*6 + 3*6 + 6*3;
	
  // Create a buffer object for spinning tetrahedrons
  var shapeBufferHandle = gl.createBuffer();  
  if (!shapeBufferHandle) {
    console.log('Failed to create the shape buffer object');
    return false;
  }


  // Bind the the buffer object to target:
  gl.bindBuffer(gl.ARRAY_BUFFER, shapeBufferHandle);
  // Transfer data from Javascript array colorShapes to Graphics system VBO
  // (Use sparingly--may be slow if you transfer large shapes stored in files)
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  var FSIZE = vertices.BYTES_PER_ELEMENT; // how many bytes per stored value?
    
  //Get graphics system's handle for our Vertex Shader's position-input variable: 
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  // Use handle to specify how to retrieve position data from our VBO:
  gl.vertexAttribPointer(
  		a_Position, 	// choose Vertex Shader attribute to fill with data
  		4, 						// how many values? 1,2,3 or 4.  (we're using x,y,z,w)
  		gl.FLOAT, 		// data type for each value: usually gl.FLOAT
  		false, 				// did we supply fixed-point data AND it needs normalizing?
  		FSIZE * 7, 		// Stride -- how many bytes used to store each vertex?
  									// (x,y,z,w, r,g,b) * bytes/value
  		0);						// Offset -- now many bytes from START of buffer to the
  									// value we will actually use?
  gl.enableVertexAttribArray(a_Position);  // Enable assignment of vertex buffer object's position data

  // Get graphics system's handle for our Vertex Shader's color-input variable;
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  // Use handle to specify how to retrieve color data from our VBO:
  gl.vertexAttribPointer(
  	a_Color, 				// choose Vertex Shader attribute to fill with data
  	3, 							// how many values? 1,2,3 or 4. (we're using R,G,B)
  	gl.FLOAT, 			// data type for each value: usually gl.FLOAT
  	false, 					// did we supply fixed-point data AND it needs normalizing?
  	FSIZE * 7, 			// Stride -- how many bytes used to store each vertex?
  									// (x,y,z,w, r,g,b) * bytes/value
  	FSIZE * 4);			// Offset -- how many bytes from START of buffer to the
  									// value we will actually use?  Need to skip over x,y,z,w
  									
  gl.enableVertexAttribArray(a_Color);  // Enable assignment of vertex buffer object's position data

  // Unbind the buffer object 
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return nn;
}

function draw(gl, n, currentAngle, modelMatrix, u_ModelMatrix) {

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  // gl.enable(gl.CULL_FACE);
  gl.frontFace(gl.CCW);
  gl.cullFace(gl.BACK);
  
  clrColr = new Float32Array(4);
  clrColr = gl.getParameter(gl.COLOR_CLEAR_VALUE);
	
  //------Draw Spinning Tetrahedron facing forward 
  modelMatrix.setTranslate(-0.3,0.5, 0.0); 
  modelMatrix.scale(1,1,-1);	
  modelMatrix.scale(0.5, 0.5, 0.5); 	
  if(!freeze )
    modelMatrix.rotate(currentAngle, 0, 0, 1);  

  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, 0, 12);


  // --------- Draw spinning Tetrahedron facing away from camera 
   modelMatrix.setTranslate(-0.3, 0.5, 0.0);  
   modelMatrix.scale(1,1,-1);	
   modelMatrix.scale(0.5, 0.5, 0.5);	
   if(!freeze)			
    modelMatrix.rotate(currentAngle*2, 0, 0, 1);

  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, 0, 12);
  
  /***** robot body ****/
  modelMatrix.setTranslate(-0.4, -0.5, 0); 
  modelMatrix.scale(1,2,1);      
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, 12, 6);


  /***** robot left leg ****/
  modelMatrix.setTranslate(-0.5, -0.7, 0); 
  modelMatrix.scale(0.5,0.5,0.5);      
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, 12, 6);

  /***** robot right leg ****/
  modelMatrix.setTranslate(-0.2, -0.7, 0); 
  modelMatrix.scale(0.5,0.5,0.5);      
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, 12, 6);
}


function drawRobotArms(gl, n, currentAngle, modelMatrix, u_ModelMatrix) {

	n = 6;
	var offset = 18;

  /******* Draw Right Arm *******/
	  //-------Draw Lower Arm---------------
	modelMatrix.setTranslate(0.2,-0.2, 0.0); 
	modelMatrix.translate(-0.5, 0,0);					
  
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, offset, n);


  //-------Draw Upper Arm----------------
  modelMatrix.translate(0.55, 0.05, 0); 		
  modelMatrix.scale(0.6,0.6,0.6);		
  if(!freeze)
    modelMatrix.rotate(currentAngle*0.8, 0,0,1);
  modelMatrix.translate(-0.1, 0, 0);	

  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, offset, n);

	// Draw Pincers
	modelMatrix.translate(0.5, 0.02, 0.0);
  if(!freeze)
	 modelMatrix.rotate(currentAngle*0.8, 0,0,1);	  

  //save the current matrix 
	pushMatrix(modelMatrix);

	modelMatrix.scale(0.4, 0.4, 0.4);		
  
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, offset, n);

	// Now move drawing axes to the centered end of that lower-jaw segment:
	modelMatrix.translate(0.5, 0.1, 0.0);
	modelMatrix.rotate(40.0, 0,0,1);		// make bend in the lower jaw
	modelMatrix.translate(-0.1, 0.0, 0.0);	
    
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, offset, n);
  
 //  // RETURN to the saved drawing axes at the 'wrist':
	// // RETRIEVE PREVIOUSLY-SAVED DRAWING AXES HERE:
	// //---------------------
	modelMatrix = popMatrix();
	// //----------------------
	
	// //=========Draw lower jaw of robot pincer============================
  if(!freeze)
	 modelMatrix.rotate(25.0 -0.5* currentAngle, 0,0,1);		
	modelMatrix.scale(0.4, 0.4, 0.4);		
	modelMatrix.translate(0.1, 0.2, 0); 
  	
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, offset, n);

	// Now move drawing axes to the centered end of that upper-jaw segment:
	modelMatrix.translate(0.5, 0.05, 0.0);
	modelMatrix.rotate(-40.0, 0,0,1);	
	modelMatrix.translate(-0.1, 0.0, 0.0);	

  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, offset, n);
	
  //
  //
  /****** Draw left arm *********/
      //-------Draw Lower Arm---------------
  modelMatrix.setTranslate(-0.2,-0.2, 0.0); 
  modelMatrix.translate(-0.5, 0,0);         
  // modelMatrix.scale(0.6, 0.6, 0.6);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, offset, n);


  //-------Draw Upper Arm----------------
  modelMatrix.translate(-0.1, 0.05, 0);     
  modelMatrix.scale(0.4,0.4,0.4);   
  // modelMatrix.rotate(currentAngle*0.8, 0,0,1);
  modelMatrix.translate(-0.1, 0, 0);  

  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, offset, n);
}


function drawCubeFeet(gl, n, currentAngle, modelMatrix, u_ModelMatrix){
  var offset = 24;
  var n = 36;
  
  // Draw the right cube foot 
  modelMatrix.setTranslate(-0.15, -0.7, 0.0); 
  modelMatrix.scale(0.2,0.2,-0.2);        
  modelMatrix.scale(0.3, 0.3, 0.3);
  if(!freeze)
    modelMatrix.rotate(currentAngle, 1, 1, 0);  
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, offset,  n);

  // Draw the left cube foor
  modelMatrix.setTranslate(-0.45, -0.7, 0.0);  
  modelMatrix.scale(0.2,0.2,-0.2);
  modelMatrix.scale(0.3, 0.3, 0.3);
  if(!freeze)
    modelMatrix.rotate(currentAngle, 1, 1, 0);  
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, offset, n);
}



function drawHex(gl, n, currentAngle, modelMatrix, u_ModelMatrix) {
  var offset = 60;
  var n = 72;

    modelMatrix.setTranslate(-0.8+xMdragTot, -0.2+yMdragTot, 0.0); 
    modelMatrix.scale(0.2, 0.2, 0.2);
    if(!freeze)
      modelMatrix.rotate(currentAngle, 1, 1, 0);  
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, offset,n);

}

function drawPyramid(gl, n, currentAngle, modelMatrix, u_ModelMatrix) {
  var offset = 132;
  var n = 3;
    modelMatrix.setTranslate(0.45, 0.3, 0.0);  
    modelMatrix.scale(0.0001, 0.0001, 0.0001);
    if(!freeze)
      modelMatrix.rotate(currentAngle, 1, 1, 0);  
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, offset+3, n);

}

function drawRandomCube(gl, n, currentAngle, modelMatrix, u_ModelMatrix) {
  var offset = 24;
  var n = 36;
  
  var rand_scale = Math.random();

  if(!freeze)
    setRandCoords();

  modelMatrix.setTranslate(rand_x, rand_y, 0.0);
  modelMatrix.scale(0.2, 0.2, 0.2); 
  if(!freeze)
    modelMatrix.rotate(currentAngle, 1, 1, 0);  
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, offset,n);
}



function setRandCoords() {

  if(rand_x >= 1.0 || rand_y >= 1.0){
    upwards = false;
    downwards = true;
  }
  if(rand_x <= -1.0 || rand_y <= -1.0){
    upwards = true;
    downwards = false;
  }

  if(upwards){
      rand_x += 0.001;
      rand_y += 0.001;
  } else { 
    rand_x -= 0.001;
    rand_y -= 0.001;
  }
}


var g_last = Date.now();

function animate(angle) {
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  var newAngle = 0.0;
  
  if(doRobot){
    //allow it to do the robot 
    newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
    if(newAngle > 180.0) newAngle = newAngle - 360.0;
    if(newAngle <-180.0) newAngle = newAngle + 360.0;
    return newAngle;
  }
  else{
    //limit the angle so it does not do full 360 
    if(angle >   20.0 && ANGLE_STEP > 0) ANGLE_STEP = -ANGLE_STEP;
    if(angle <  -85.0 && ANGLE_STEP < 0) ANGLE_STEP = -ANGLE_STEP;
    
    newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
    return newAngle %= 360;
  }
}

function myMouseDown(ev, gl, canvas, n, currentAngle, modelMatrix, u_ModelMatrix) {


// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
  var xp = ev.clientX - rect.left;                  // x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge

  
  // Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  /    // move origin to center of canvas and
               (canvas.width/2);      // normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height/2) /    //                     -1 <= y < +1.
               (canvas.height/2);
//  console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);
  
  //ydifference = ydifference +0.01
  isDrag = true;                      // set our mouse-dragging flag
  xMclik = x;                         // record where mouse-dragging began
  yMclik = y;
  if(ev.button == 0){

  }
  console.log('ev.button='+ev.button);
  drawRandomCube(gl, n, currentAngle, modelMatrix, u_ModelMatrix);
  console.log("should be running radnom cube");
  setClearColor(gl);
};


function myMouseMove(ev, gl, canvas) {

  if(isDrag==false) return;       // IGNORE all mouse-moves except 'dragging'

  // Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
  var xp = ev.clientX - rect.left;                  // x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
//  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);
  
  // Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  /    // move origin to center of canvas and
               (canvas.width/2);      // normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height/2) /    //                     -1 <= y < +1.
               (canvas.height/2);
//  console.log('myMouseMove(CVV coords  ):  x, y=\t',x,',\t',y);

  // find how far we dragged the mouse:
  xMdragTot += (x - xMclik);          // Accumulate change-in-mouse-position,&
  yMdragTot += (y - yMclik);
  xMclik = x;                         // Make next drag-measurement from here.
  yMclik = y;
};

function myMouseUp(ev, gl, canvas) {

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
  var xp = ev.clientX - rect.left;                  // x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
//  console.log('myMouseUp  (pixel coords): xp,yp=\t',xp,',\t',yp);
  
  // Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  /    // move origin to center of canvas and
               (canvas.width/2);      // normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height/2) /    //                     -1 <= y < +1.
               (canvas.height/2);
  console.log('myMouseUp  (CVV coords  ):  x, y=\t',x,',\t',y);
  
  isDrag = false;                     // CLEAR our mouse-dragging flag, and
  // accumulate any final bit of mouse-dragging we did:
  xMdragTot += (x - xMclik);
  yMdragTot += (y - yMclik);
  console.log('myMouseUp: xMdragTot,yMdragTot =',xMdragTot,',\t',yMdragTot);
};

function myKeyDown(ev) {

  switch(ev.keyCode) {      
    case 37:    // left arrow key
      console.log(' left-arrow ');
      lessCCW();
      break;
    case 72:    // h key
      console.log('help key -- h key');
      document.getElementById("instructions").style.display='block';
      break;
    case 39:    // right arrow key
      console.log('right arrow');
      moreCCW();
      break;
    case 32:    // space key
      console.log(' space key');
      toggleFeet();
      break;
    case 65: // a key
      console.log(' a key');
      setClick = true;
      break;
    case 83:
      console.log(' s key');
      setClick = false;
      break;
    default:
      console.log('myKeyDown()--keycode=', ev.keyCode, ', charCode=', ev.charCode);
      break;
  }
}

function myKeyUp(ev) {

  console.log('myKeyUp()--keyCode='+ev.keyCode+' released.');
}

function myKeyPress(ev) {
  console.log('myKeyPress():keyCode='+ev.keyCode  +', charCode=' +ev.charCode+
                        ', shift='    +ev.shiftKey + ', ctrl='    +ev.ctrlKey +
                        ', altKey='   +ev.altKey   +
                        ', metaKey(Command key or Windows key)='+ev.metaKey);
}

function setClearColor(gl){

  gl.clearColor(Math.random(), Math.random(), Math.random(), Math.random());
  console.log('changed color background');
}

function moreCCW() {

  ANGLE_STEP += 10; 
}

function lessCCW() {

  ANGLE_STEP -= 10; 
}

function toggleFeet(){
  if(feet){
    feet = false;
  } else {
    feet = true;
  }
}

