/*
Mariah Balandran
mbalandr@ucsc.edu

Notes to Grader:
Closely followed video tutorial playlist provided at the top of the assignment. Only cubes and spheres from my blocky animal included because my pyramids did not use the draw trangle functions, so they could not respond to lighting. Skipped assignment 3 (approved by Professor Davis) so I had no camera class and just used the globalRotateMatrix from assignment 2. Referenced ChatGPT for help with spotlight.
*/

// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec3 a_Normal;
  varying vec3 v_Normal;
  varying vec4 v_vPos;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  uniform mat4 u_NormalMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_Normal = normalize(vec3(u_NormalMatrix * vec4(a_Normal, 1)));
    v_vPos = u_ModelMatrix * a_Position;
  }`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  uniform int u_whichColor;
  varying vec3 v_Normal;
  varying vec4 v_vPos;

  uniform vec3 u_lightPos;
  uniform vec3 u_cameraPos;
  uniform bool u_specON;
  uniform bool u_lightON;
  uniform vec3 u_lightColor;

  // Spotlight uniforms
  uniform vec3 u_spotlightPos;
  uniform bool u_spotlightON;
  uniform vec3 u_spotlightDir;
  uniform float u_spotlightCutoff;
  uniform float u_spotlightOuterCutoff;
  uniform vec3 u_spotlightColor;
  
  void main() {
    if (u_whichColor == -1) {
      gl_FragColor = u_FragColor;
    } else if (u_whichColor == 0) {
      gl_FragColor = vec4((v_Normal+1.0)/2.0,1.0);
    } else {
      gl_FragColor = vec4(1, 0.2, 0.2, 1);
    }

    vec3 lightVec = u_lightPos - vec3(v_vPos);
    float r = length(lightVec);
    
    // if (r < 1.0) {
    //   gl_FragColor = vec4(1,0,0,1);
    // } else if (r < 2.0) {
    //   gl_FragColor = vec4(0,1,0,1);
    // }

    // gl_FragColor = vec4(vec3(gl_FragColor)/(r*r),1);

    // N dot L
    vec3 L = normalize(lightVec);
    vec3 N = normalize(v_Normal);
    float nDotL = max(dot(N,L), 0.0);
    // gl_FragColor = gl_FragColor * nDotL * 0.7;
    // gl_FragColor.a = 1.0;

    // Reflection
    vec3 R = reflect(L,N);

    // Eye
    vec3 E = normalize(u_cameraPos - vec3(v_vPos));

    // Specular
    float specular = 0.0;

    vec3 diffuse = vec3(gl_FragColor) * nDotL * 0.7;
    vec3 ambient = vec3(gl_FragColor) * 0.3;

    if (u_specON) {
      specular = pow(max(dot(E, R), 0.0), 10.0);
    }

    // if (u_lightON) {
    //   gl_FragColor = vec4((specular + diffuse + ambient) * u_lightColor, 1.0);
    // }
    
    vec3 lighting = (specular + diffuse + ambient) * u_lightColor;

    // Spotlight calculation
    vec3 spotDir = normalize(vec3(v_vPos) - u_spotlightPos);
    float theta = dot(spotDir, normalize(-u_spotlightDir));

    float epsilon = u_spotlightCutoff - u_spotlightOuterCutoff;
    float intensity = smoothstep(u_spotlightOuterCutoff, u_spotlightCutoff, theta);

    if (u_lightON) {
        if (u_spotlightON) {
            lighting += (intensity * u_spotlightColor);
        }
        gl_FragColor = vec4(lighting, 1.0);
    }
  }`;

// Global Variables
var canvas, gl;
var a_Position, a_Normal, u_FragColor, u_Size, u_whichColor, u_ModelMatrix, u_GlobalRotateMatrix, u_ViewMatrix, u_ProjectionMatrix, u_NormalMatrix;

// Camera Variables
var g_eye = [0,0,5];
var g_at = [0,0,-100];
var g_up = [0,1,0];
var u_cameraPos;

// Normal Variables
var g_normalON = false;

// Light Variables
var u_lightPos, u_specON, u_lightON, u_lightColor;
var g_lightPos = [0,1,-2];
var g_lightON = true;
var g_lightColor = [1.0,1.0,1.0];

// Spotlight Variables
var u_spotlightPos, u_spotlightDir, u_spotlightCutoff, u_spotlightOuterCutoff, u_spotlightColor, u_spotlightON;
var g_spotlightPos = [-0.75, 1, -0.75];
var g_spotlightDir = [0.0, 1.0, 0.0];
var g_spotlightCutoff = Math.cos(15 * (Math.PI / 180));
var g_spotlightOuterCutoff = Math.cos(25 * (Math.PI / 180));
var g_spotlightColor = [1.0, 1.0, 1.0];
var g_spotlightON = true;

// Color Variables
var shirtColor, headColor, eyeColor, hairColor, skirtColor, legColor, shinColor, shoeColor;

// Animation Globals
var g_targetFPS = 60;
var g_frameInterval = 1000 / g_targetFPS;
var g_lastFrameTime = performance.now();
var g_lastFPSUpdate = performance.now();
var g_frameCount = 0;
var g_currentFPS = 0;
var fpsArray = [];
var speedMultiplier = 2.25;
var g_startTime = performance.now() * 0.001;
var g_seconds = 0;

// Rotation Variables
var globalRotMat = new Matrix4();
var g_globalAngle = 2;

// Hue Shift
var g_hueShift = 0;

// Animation Toggle Variables
var g_armAnim = false;
var g_chestAnim = false;
var g_neckAnim = false;
var g_eyeAnim = false;
var g_headAnim = false;
var g_legAnim = false;
var g_skirtAnim = false;
var g_posAnim = true;

// Shape & Rendering Variables
var g_selectedShape = 'cube';
var g_shapesList = [];

// Body Part Angle and Position Variables
var g_headAngle = 0;
var g_headPosY = 0;
var g_eyePosX = 0;
var g_eyePosY = 0;
var g_braidLY = 0, g_braidRY = 0;
var g_braidL2Y = 0, g_braidR2Y = 0;
var g_braidL3Y = 0, g_braidR3Y = 0;

var g_neckAngle = 0;
var g_chestAngle = 0;
var g_chestAngleZ = 0;
var g_chestPosY = 0;
var g_armLAngle = 0;
var g_armRAngle = 0;
var g_armLPos = 0;
var g_armRPos = 0;

var g_skirtAngle = 0;
var g_skirtPosY = 0;
var g_thighLAngle = 0;
var g_shinLAngle = 0;
var g_footLAngle = 0;
var g_thighRAngle = 0;
var g_shinRAngle = 0;
var g_footRAngle = 0;

// Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// UI Globals
var g_selectedColor = [1.0, 1.0, 1.0, 1.0];
var g_selectedSize = 5;
var g_selectedType = POINT;
var g_selectedSeg = 10;

function main() {
    // Canvas and GL vars
    getWebGL();

    // Init GLSL shader programs and connect GLSL vars
    connectGLSL();

    //Set initial img value
    document.getElementById('ref-img').style.display = 'none';

    // Actions for HTML UI
    htmlActions();

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Enable alpha blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // Learned about alpha blending from ChatGPT when debugging my implementation

    // Initialize global rotation before first frame
    setUniformColor([1.0, 1.0, 1.0, 1.0]);
    updateGlobalRotation();

    // renderShapes();
    requestAnimationFrame(tick);
}

function updateGlobalRotation() {
    globalRotMat.setRotate(g_globalAngle, 0, 1, 0);
}

function defaultTransform(obj) {
    obj.matrix.setTranslate(0.0, -0.5, 0.0);
    obj.matrix.rotate(0, 1, 0, 0);
    obj.matrix.rotate(0, 0, 1, 0);
    obj.matrix.rotate(0, 0, 0, 1);
}

function arraysEqual(a, b) {
    return a.length === b.length && a.every((val, index) => val === b[index]);
}

function setUniformColor(color) {
    if (!arraysEqual(g_selectedColor, color)) {
        gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);
        g_selectedColor = color;
    }
}

function setTargetFPS(fps) {
    g_targetFPS = fps;
    g_frameInterval = 1000 / g_targetFPS;
}

function updateFPS(currentTime) {
    fpsArray.push(g_currentFPS);
    if (fpsArray.length > 10) fpsArray.shift();
    let avgFPS = fpsArray.reduce((a, b) => a + b) / fpsArray.length;
    setText(`fps: ${Math.round(avgFPS)}`, "numdot");
}

function tick() {
    requestAnimationFrame(tick);

    const currentTime = performance.now();
    const deltaTime = currentTime - g_lastFrameTime;

    if (deltaTime >= g_frameInterval) {
        g_lastFrameTime = currentTime - (deltaTime % g_frameInterval); // Adjust for drift
        
        g_seconds = (performance.now() * 0.001) - g_startTime; // Update animation time

        updateAnimAng();
        updateGlobalRotation();
        renderShapes();

        g_frameCount++;
        if (currentTime - g_lastFPSUpdate >= 1000) {
            g_currentFPS = g_frameCount;
            g_frameCount = 0;
            g_lastFPSUpdate = currentTime;
            updateFPS(currentTime);
        }
    }
}

//Update the angles of everything if currently animated
function updateAnimAng() {
    var time = g_seconds * speedMultiplier;

    g_lightPos[2] = (2 * Math.cos(time/2));


    if (g_armAnim) {
        g_armLAngle = (-25 * Math.sin(time));
        g_armRAngle = (-10 * Math.sin(time));
        // Update arm slider position
        document.getElementById('armLSlide').value = g_armLAngle;
        document.getElementById('armRSlide').value = g_armRAngle;
    }
    if (g_chestAnim) {
        g_chestAngle = (7 * Math.sin(time));
        // Update chest slider position
        document.getElementById('chestSlide').value = g_chestAngle;
    }
    if (g_neckAnim) {
        g_neckAngle = (0.5 * Math.sin(time));
        // Update neck slider position
        document.getElementById('neckSlide').value = g_neckAngle;
    }
    if (g_eyeAnim) {
        g_eyePosX = (0.035 * Math.sin(time));
        // Update eye slider position
        document.getElementById('eyeSlide').value = g_eyePosX;
    }
    if (g_headAnim) {
        g_headAngle = (10 * Math.sin(time));
        // Update eye slider position
        document.getElementById('headSlide').value = g_headAngle;
    }
    if (g_legAnim) {
        g_thighRAngle = (-5 * Math.sin(time));
        g_thighLAngle = (-2 * Math.sin(time));
        g_footRAngle = (0.5 * Math.sin(time));
        g_footLAngle = (0.25 * Math.sin(time));
        // Update knee and foot slider
        document.getElementById("shinRSlide").value = g_thighRAngle;
        document.getElementById("shinLSlide").value = g_thighLAngle;
        document.getElementById("footRSlide").value = g_footRAngle;
        document.getElementById("footLSlide").value = g_footLAngle;
    }
    if (g_skirtAnim) {
        g_skirtAngle = (0.2 * Math.sin(time));
        g_chestAngleZ = (8 * Math.sin(time));
        // Update skirt slider
        document.getElementById("skirtSlide").value = g_skirtAngle;
        document.getElementById('chestSlide').value = g_chestAngleZ;
    }
    if (g_posAnim) {
        g_skirtPosY = (0.02 * Math.sin(time+3.5)) -0.005;
        g_chestPosY = (0.02 * Math.sin(time+3));
        g_armLPos = (0.03 * Math.sin(time+3)) - 0.045;
        g_armRPos = (0.03 * Math.sin(time+3)) - 0.045;
        g_headPosY = (0.03 * Math.sin(time+2)) -0.05;
        g_eyePosY = (0.01 * Math.sin(time+1.5));
        g_braidLY = (0.01 * Math.sin(time+1));
        g_braidRY = (0.01 * Math.sin(time+1));
        g_braidL2Y = (0.02 * Math.sin(time+0.5));
        g_braidR2Y = (0.02 * Math.sin(time+0.5));
        g_braidL3Y = (0.03 * Math.sin(time));
        g_braidR3Y = (0.03 * Math.sin(time));

        g_chestAngleZ = (Math.cos(time));
        //Update pos slider
        document.getElementById("skirtSlide").value = g_skirtPosY*100;
        document.getElementById("chest3Slide").value = g_chestPosY*1000;
        document.getElementById("braidLSlide").value = g_braidL2Y*1000;
        document.getElementById("braidRSlide").value = g_braidR2Y*1000;
        document.getElementById("armRSlide").value = g_armRPos*100;
        document.getElementById("armLSlide").value = g_armLPos*100;
        document.getElementById("eye2Slide").value = g_armLPos*1000;
    }
}

function getWebGL() {
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true } );
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    gl.enable(gl.DEPTH_TEST);
}

function connectGLSL() {
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // Get the storage location of a_Position
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }

    // Get the storage location of a_Normal
    a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
    if (a_Normal < 0) {
        console.log('Failed to get the storage location of a_Normal');
        return;
    }

    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }

    // Get the storage location of u_whichColor
    u_whichColor = gl.getUniformLocation(gl.program, 'u_whichColor');
    if (!u_whichColor) {
        console.log('Failed to get the storage location of u_whichColor');
        return;
    }

    // Get the storage location of u_ModelMatrix
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log('Failed to get the storage location of u_ModelMatrix');
        return;
    }

    // Get the storage location of u_GlobalRotateMatrix
    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if (!u_GlobalRotateMatrix) {
        console.log('Failed to get the storage location of u_GlobalRotateMatrix');
        return;
    }

    // Get the storage location of u_ViewMatrix
    u_ViewMatrix = gl.getUniformLocation(gl.program, "u_ViewMatrix");
    if (!u_ViewMatrix) {
        console.log("Failed to get the storage location of u_ViewMatrix");
        return;
    }
  
    // Get the storage location of u_ProjectionMatrix
    u_ProjectionMatrix = gl.getUniformLocation(gl.program, "u_ProjectionMatrix");
    if (!u_ProjectionMatrix) {
        console.log("Failed to get the storage location of u_ProjectionMatrix");
        return;
    }

    // Get the storage location of u_NormalMatrix
    u_NormalMatrix = gl.getUniformLocation(gl.program, "u_NormalMatrix");
    if (!u_NormalMatrix) {
        console.log("Failed to get the storage location of u_NormalMatrix");
        return;
    }

    // Get the storage location of u_lightPos
    u_lightPos = gl.getUniformLocation(gl.program, "u_lightPos");
    if (!u_lightPos) {
        console.log("Failed to get the storage location of u_lightPos");
        return;
    }

    // Get the storage location of u_cameraPos
    u_cameraPos = gl.getUniformLocation(gl.program, "u_cameraPos");
    if (!u_cameraPos) {
        console.log("Failed to get the storage location of u_cameraPos");
        return;
    }

    // Get the storage location of u_specON
    u_specON = gl.getUniformLocation(gl.program, "u_specON");
    if (!u_specON) {
        console.log("Failed to get the storage location of u_specON");
        return;
    }

    // Get the storage location of u_lightON
    u_lightON = gl.getUniformLocation(gl.program, "u_lightON");
    if (!u_lightON) {
        console.log("Failed to get the storage location of u_lightON");
        return;
    }

    // Get the storage location of u_lightColor
    u_lightColor = gl.getUniformLocation(gl.program, "u_lightColor");
    if (!u_lightColor) {
        console.log("Failed to get the storage location of u_lightColor");
        return;
    }

    // Get the storage location of u_spotlightPos
    u_spotlightPos = gl.getUniformLocation(gl.program, "u_spotlightPos");
    if (!u_spotlightPos) {
        console.log("Failed to get the storage location of u_spotlightPos");
        return;
    }

    // Get the storage location of u_spotlightDir
    u_spotlightDir = gl.getUniformLocation(gl.program, "u_spotlightDir");
    if (!u_spotlightDir) {
        console.log("Failed to get the storage location of u_spotlightDir");
        return;
    }

    // Get the storage location of u_spotlightColor
    u_spotlightColor = gl.getUniformLocation(gl.program, "u_spotlightColor");
    if (!u_spotlightColor) {
        console.log("Failed to get the storage location of u_spotlightColor");
        return;
    }

    // Get the storage location of u_spotlightCutoff
    u_spotlightCutoff = gl.getUniformLocation(gl.program, "u_spotlightCutoff");
    if (!u_spotlightCutoff) {
        console.log("Failed to get the storage location of u_spotlightCutoff");
        return;
    }

    // Get the storage location of u_spotlightOuterCutoff
    u_spotlightOuterCutoff = gl.getUniformLocation(gl.program, "u_spotlightOuterCutoff");
    if (!u_spotlightOuterCutoff) {
        console.log("Failed to get the storage location of u_spotlightOuterCutoff");
        return;
    }

    // Get the storage location of u_spotlightON
    u_spotlightON = gl.getUniformLocation(gl.program, "u_spotlightON");
    if (!u_spotlightON) {
        console.log("Failed to get the storage location of u_spotlightON");
        return;
    }


    // Set identity matrix as default
    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

function eventToGL(ev) {
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

    return([x, y]);
}

function renderShapes() {
    var startTime = performance.now();

    var projMat = new Matrix4();
    projMat.setPerspective(30, canvas.width/canvas.height, .1, 100);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

    var viewMat = new Matrix4();
    viewMat.setLookAt(g_eye[0],g_eye[1],g_eye[2],  g_at[0],g_at[1],g_at[2],  g_up[0],g_up[1],g_up[2]); // (eye, at, up)

    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);
    
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clear(gl.COLOR_BUFFER_BIT);


    // Set default to white
    gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0);

    // Base colors
    const baseShirtColor = [0.549, 0.616, 0.847, 1.0];
    const baseHeadColor = [0.678, 0.949, 1.0, 1.0];
    const baseEyeColor = [0.157, 0.263, 0.349, 1.0];
    const baseHairColor = [0.157, 0.263, 0.349, 1.0];
    const baseSkirtColor = [0.367, 0.512, 0.747, 1.0];
    const baseLegColor = [0.678, 0.949, 1.0, 1.0];
    const baseShinColor = [0.549, 0.616, 0.847, 1.0];
    const baseShoeColor = [0.157, 0.263, 0.349, 1.0];

    // In renderShapes()
    shirtColor = shiftColor(baseShirtColor, g_hueShift);
    headColor = shiftColor(baseHeadColor, g_hueShift);
    eyeColor = shiftColor(baseEyeColor, g_hueShift);
    hairColor = shiftColor(baseHairColor, g_hueShift);
    skirtColor = shiftColor(baseSkirtColor, g_hueShift);
    legColor = shiftColor(baseLegColor, g_hueShift);
    shinColor = shiftColor(baseShinColor, g_hueShift);
    shoeColor = shiftColor(baseShoeColor, g_hueShift);

    gl.uniform3f(u_lightPos, g_lightPos[0],g_lightPos[1],g_lightPos[2]);

    gl.uniform3f(u_lightColor, g_lightColor[0],g_lightColor[1],g_lightColor[2]);

    gl.uniform3f(u_cameraPos, g_eye[0], g_eye[0], g_eye[0]);

    gl.uniform1i(u_lightON, g_lightON);

    gl.uniform3f(u_spotlightPos, g_spotlightPos[0], g_spotlightPos[1], g_spotlightPos[2]); // Spotlight position
    gl.uniform3f(u_spotlightDir, g_spotlightDir[0], g_spotlightDir[1], g_spotlightDir[2],); // Direction the spotlight is pointing
    gl.uniform1f(u_spotlightCutoff, g_spotlightCutoff); // Inner cutoff (15 degrees)
    gl.uniform1f(u_spotlightOuterCutoff, g_spotlightOuterCutoff); // Outer cutoff (25 degrees)
    gl.uniform3f(u_spotlightColor, g_spotlightColor[0], g_spotlightColor[1], g_spotlightColor[2]); // White light

    gl.uniform1i(u_spotlightON, g_spotlightON);

    // Light
    var light = new Cube();
    light.color = [1.0, 1.0, 0.0, 1.0];
    light.colorNum = -1;
    light.specON = false;
    if (g_normalON) light.colorNum = 0;
    light.matrix.translate(g_lightPos[0],g_lightPos[1],g_lightPos[2]);
    light.matrix.scale(0.2,-0.2,-0.2);
    light.matrix.translate(-0.5,-0.5,-0.5);
    light.render();

    // Spotlight
    var spot = new Cube();
    spot.color = [1.0, 0.0, 0.0, 1.0];
    spot.colorNum = -1;
    spot.specON = false;
    if (g_normalON) spot.colorNum = 0;
    spot.matrix.translate(g_spotlightPos[0],g_spotlightPos[1],g_spotlightPos[2]);
    spot.matrix.scale(0.2,-0.2,-0.2);
    spot.matrix.translate(-0.5,-0.5,-0.5);
    spot.render();

    // Floor plane
    var floor = new Cube();
    floor.color = [0.367, 0.512, 0.747, 1.0];
    floor.colorNum = -1;
    floor.specON = false;
    if (g_normalON) floor.colorNum = 0;
    floor.matrix.translate(0,-1,0);
    floor.matrix.scale(10,0,10);
    floor.matrix.translate(-0.5,0,-0.5);
    floor.render();

    // Sky
    var sky = new Cube();
    sky.color = [0.549, 0.616, 0.847, 1.0];
    sky.colorNum = -1;
    sky.specON = false;
    if (g_normalON) sky.colorNum = 0;
    sky.matrix.scale(-10,-10,-10);
    sky.matrix.translate(-0.5,-0.5,-0.5);
    sky.render();

    // Cube
    var box = new Cube();
    box.color = [0.678, 0.949, 1.0, 1.0];
    box.colorNum = -1;
    box.specON = false;
    if (g_normalON) box.colorNum = 0;
    box.matrix.scale(1,1,1);
    box.matrix.translate(-0.85,-1.0,-1.5);
    box.render();

    // Sphere
    var ball = new Sphere();
    ball.segments = 16;
    ball.color = [0.157, 0.263, 0.349, 1.0];
    ball.colorNum = -1;
    ball.specON = true;
    if (g_normalON) ball.colorNum = 0;
    ball.matrix.scale(0.5,0.5,0.5);
    ball.matrix.translate(1.25, 0.75,-1.0);
    ball.render();

    /////////////////////// EYEBALL GIRL ///////////////////////

    // Top Half

    // Draw chest (cube)
    var chest = new Cube();
    chest.color = shirtColor;
    chest.colorNum = -1;
    chest.specON = false;
    if (g_normalON) chest.colorNum = 0;
    defaultTransform(chest);
    chest.matrix.rotate(-g_chestAngle, 1, 0, 0); // rotate x-axis to lean forward
    chest.matrix.rotate(-g_chestAngleZ, 0, 0, 1); // rotate z-axis to lean side to side 
    chest.matrix.translate(0.0, 0.0 + g_chestPosY, 0.0); // position y-axis to bob
    var chestCoordsMatrixNeck = new Matrix4(chest.matrix);
    chest.matrix.translate(-0.25, 0.45, 0.0);
    chest.matrix.rotate(10, 0, 0, 1); // z-axis
    chest.matrix.rotate(10, 0, 1, 0); // y-axis
    chest.matrix.scale(0.275, 0.39, 0.18);
    chest.normalMatrix.setInverseOf(chest.matrix).transpose();
    chest.render();

    // Draw neck (cube)
    var neck = new Cube();
    neck.color = shirtColor;
    neck.colorNum = -1;
    neck.specON = false;
    if (g_normalON) neck.colorNum = 0;
    neck.matrix = chestCoordsMatrixNeck;
    neck.matrix.translate(0, -0.05, 0);  // Move up for pivot
    neck.matrix.rotate(-g_neckAngle, 1, 0, 0); // rotate y-axis to turn neck
    neck.matrix.rotate(-g_headAngle, 0, 1, 0); // rotate y-axis to turn neck
    var neckCoordsMatrix = new Matrix4(neck.matrix);
    neck.matrix.rotate(10, 0, 0, 1); // z-axis
    neck.matrix.rotate(10, 0, 1, 0); // y-axis
    neck.matrix.translate(0.0, 0.05, 0.0); // Move back to original position
    neck.matrix.translate(-0.0655, 0.8, 0.0175);
    neck.matrix.scale(0.1, 0.2, 0.1);
    neck.normalMatrix.setInverseOf(neck.matrix).transpose();
    neck.render();

    // Draw head (sphere)
    var head = new Sphere();
    head.segments = 16;
    head.color = headColor;
    head.colorNum = -1;
    head.specON = true;
    if (g_normalON) head.colorNum = 0;
    head.matrix = neckCoordsMatrix;
    head.matrix.translate(0.0, 0.0 + 0.25*g_headPosY, 0.0); // position y-axis to bob
    var headCoordsMatrixEye = new Matrix4(head.matrix);
    head.matrix.translate(-0.22, 1.175, 0.05);
    head.matrix.rotate(10, 0, 0, 1); // z-axis
    head.matrix.rotate(10, 0, 1, 0); // y-axis
    head.matrix.scale(0.215, 0.215, 0.215);
    head.normalMatrix.setInverseOf(head.matrix).transpose();
    head.render();

    // Draw eye (sphere)
    var eye = new Sphere();
    eye.segments = 16;
    eye.color = eyeColor;
    eye.colorNum = -1;
    eye.specON = true;
    if (g_normalON) eye.colorNum = 0;
    eye.matrix = headCoordsMatrixEye;
    eye.matrix.rotate(10, 0, 0, 1); // z-axis
    eye.matrix.rotate(10, 0, 1, 0); // y-axis
    eye.matrix.translate(-0.0 + g_eyePosX, 1.18 + g_eyePosY, 0.2); // position to move eye 
    eye.matrix.scale(0.125, 0.125, 0.1);
    eye.normalMatrix.setInverseOf(eye.matrix).transpose();
    eye.render();

    // Bottom Half

    // Left Leg

    // Draw left thigh (cube)
    var thighL = new Cube();
    thighL.color = legColor;
    thighL.colorNum = -1;
    thighL.specON = false;
    if (g_normalON) thighL.colorNum = 0;
    defaultTransform(thighL);
    thighL.matrix.translate(0, 0.5, 0);  // Move up for pivot
    thighL.matrix.rotate(-g_thighLAngle, 0, 0, 1); // rotate z-axis to position left leg
    var thighLCoordsMatrix = new Matrix4(thighL.matrix);
    thighL.matrix.rotate(15, 0, 0, 1); // z-axis
    thighL.matrix.rotate(10, 0, 1, 0); // y-axis
    thighL.matrix.translate(0.0, -0.5, 0.0); // Move back to original position
    thighL.matrix.translate(-0.105, 0.0, 0.01);
    thighL.matrix.scale(0.1, 0.4, 0.1);
    thighL.normalMatrix.setInverseOf(thighL.matrix).transpose();
    thighL.render();

    // Draw left shin (cube)
    var shinL = new Cube();
    shinL.color = shinColor;
    shinL.colorNum = -1;
    shinL.specON = false;
    if (g_normalON) shinL.colorNum = 0;
    shinL.matrix = thighLCoordsMatrix;
    shinL.matrix.translate(0, 0.5, 0);  // Move up for pivot
    shinL.matrix.rotate(-g_shinLAngle, 0, 0, 1); // rotate z-axis to position left knee
    var shinLCoordsMatrix = new Matrix4(shinL.matrix);
    shinL.matrix.rotate(15, 0, 0, 1); // z-axis
    shinL.matrix.rotate(10, 0, 1, 0); // y-axis
    shinL.matrix.translate(0.0, -0.5, 0.0); // Move back to original position
    shinL.matrix.translate(-0.233/*-0.178*/, -0.85, -0.0115);
    shinL.matrix.scale(0.1, 0.4, 0.1);
    shinL.normalMatrix.setInverseOf(shinL.matrix).transpose();
    shinL.render();

    // Right Leg

    // Draw right thigh (cube)
    var thighR = new Cube();
    thighR.color = legColor;
    thighR.colorNum = -1;
    thighR.specON = false;
    if (g_normalON) thighR.colorNum = 0;
    defaultTransform(thighR);
    thighR.matrix.translate(0, 0.5, 0);  // Move up for pivot
    thighR.matrix.rotate(-g_thighRAngle, 0, 0, 1); // rotate z-axis to position right leg
    var thighRCoordsMatrix = new Matrix4(thighR.matrix);
    thighR.matrix.rotate(-6, 0, 0, 1); // z-axis
    thighR.matrix.rotate(10, 0, 1, 0); // y-axis
    thighR.matrix.rotate(-3, 1, 0, 0); // x-axis
    thighR.matrix.translate(0.0, -0.5, 0.0); // Move back to original position
    thighR.matrix.translate(-0.2, -0.015, 0.01);
    thighR.matrix.scale(0.1, 0.4, 0.1);
    thighR.normalMatrix.setInverseOf(thighR.matrix).transpose();
    thighR.render();

    // Draw right shin (cube)
    var shinR = new Cube();
    shinR.color = shinColor;
    shinR.colorNum = -1;
    shinR.specON = false;
    if (g_normalON) shinR.colorNum = 0;
    shinR.matrix = thighRCoordsMatrix;
    shinR.matrix.translate(0, 0.5, 0);  // Move up for pivot
    shinR.matrix.rotate(-g_shinRAngle, 0, 0, 1); // rotate x-axis to position right knee
    var shinRCoordsMatrix = new Matrix4(shinR.matrix);
    shinR.matrix.rotate(-20, 0, 0, 1); // z-axis
    shinR.matrix.rotate(10, 0, 1, 0); // y-axis
    shinR.matrix.rotate(-4, 1, 0, 0); // x-axis
    shinR.matrix.translate(0.0, -0.5, 0.0); // Move back to original position
    shinR.matrix.translate(0.09, -0.895, 0.015);
    shinR.matrix.scale(0.1, 0.4, 0.1);
    shinR.normalMatrix.setInverseOf(shinR.matrix).transpose();
    shinR.render();

    var duration = performance.now() - startTime;
}

// Set text of HTML element
function setText(text, htmlID) {
    var hElem = document.getElementById(htmlID);

    if (!hElem) {
        console.log("Failed to get " + htmlID + " from HTML");
        return;
    }

    hElem.innerHTML = text;
}

//Reset pose/camera
function resetScene() {
    g_globalAngle = 2;
    g_hueShift = 0;

    g_normalON = false;
    g_lightON = true;
    g_lightColor = [1.0,1.0,1.0];

    g_lightPos = [0,1,-2];

    g_spotlightON = true;
    g_spotlightColor = [1.0,1.0,1.0];

    g_spotlightPos = [-0.75, 1, -0.75];

    g_headAngle = 0;
    g_headPosY = 0;
    g_eyePosX = 0;
    g_eyePosY = 0;
    g_braidLY = 0;
    g_braidRY = 0;
    g_braidL2Y = 0;
    g_braidR2Y = 0;
    g_braidL3Y = 0;
    g_braidR3Y = 0;

    g_neckAngle = 0;
    g_chestAngle = 0;
    g_chestAngleZ = 0;
    g_chestPosY = 0;
    g_armLAngle = 0;
    g_armRAngle = 0;
    g_armLPos = 0;
    g_armRPos = 0;

    g_skirtAngle = 0;
    g_thighLAngle = 0;
    g_shinLAngle = 0;
    g_footLAngle = 0;
    g_thighRAngle = 0;
    g_shinRAngle = 0;
    g_footRAngle = 0;

    g_startTime = performance.now() * 0.001; // Reset animation time
    g_seconds = 0;

    g_targetFPS = 60;  // Desired FPS
    g_frameInterval = 1000 / g_targetFPS; // ms per frame
    g_lastFrameTime = performance.now();;
    g_frameCount = 0;
    g_lastFPSUpdate = performance.now();
    g_currentFPS = 0;
    fpsArray = [];
    speedMultiplier = 2.25;
    g_headAnim = false; 
    g_eyeAnim =  false; 
    g_legAnim = false; 
    g_skirtAnim = false;
    g_chestAnim = false; 
    g_armAnim = false; 
    g_neckAnim = false; 
    g_eyeAnim = false;
    g_posAnim = false;

    // Reset slider values
    document.getElementById("angSlide").value = g_globalAngle;
    document.getElementById("hueSlider").value = g_hueShift;
    document.getElementById("headSlide").value = g_headAngle;
    document.getElementById("braidLSlide").value = g_braidL2Y;
    document.getElementById("braidRSlide").value = g_braidR2Y;
    document.getElementById("eyeSlide").value = g_eyePosX;
    document.getElementById("eye2Slide").value = g_eyePosY;
    document.getElementById("neckSlide").value = g_neckAngle;
    document.getElementById("chestSlide").value = g_chestAngle;
    document.getElementById("chest2Slide").value = g_chestAngleZ;
    document.getElementById("chest3Slide").value = g_chestPosY;
    document.getElementById("skirtSlide").value = g_skirtAngle;
    document.getElementById("armLSlide").value = g_armLAngle;
    document.getElementById("armRSlide").value = g_armRAngle;
    document.getElementById("thighLSlide").value = g_thighLAngle;
    document.getElementById("shinLSlide").value = g_shinLAngle;
    document.getElementById("footLSlide").value = g_footLAngle;
    document.getElementById("thighRSlide").value = g_thighRAngle;
    document.getElementById("shinRSlide").value = g_shinRAngle;
    document.getElementById("footRSlide").value = g_footRAngle;
    document.getElementById("fpsSlide").value = g_targetFPS;
    document.getElementById("speedSlide").value = speedMultiplier;
    document.getElementById("lxSlide").value = g_lightPos[0]*100;
    document.getElementById("lySlide").value = g_lightPos[1]*100;
    document.getElementById("lzSlide").value = g_lightPos[2]*100;
    document.getElementById("lrSlide").value = g_lightColor[0]*100;
    document.getElementById("lgSlide").value = g_lightColor[1]*100;
    document.getElementById("lbSlide").value = g_lightColor[2]*100;
}

function htmlActions() {

    //Button Events (Animation) 
    document.getElementById('idleOFF').onclick = function() { g_posAnim = false; }; 

    setupSliders();

    document.getElementById('eyeSlide').addEventListener('mousemove', function () { g_eyePosX = (this.value)/500;});
    document.getElementById('eye2Slide').addEventListener('mousemove', function () { g_eyePosY = (this.value)/500;});
    document.getElementById('braidLSlide').addEventListener('mousemove', function () { g_braidLY = (this.value)/500;});
    document.getElementById('braidRSlide').addEventListener('mousemove', function () { g_braidRY = (this.value)/500;});
    document.getElementById('chest3Slide').addEventListener('mousemove', function () { g_chestPosY = (this.value)/500;});
    document.getElementById('skirtSlide').addEventListener('mousemove', function () { g_skirtAngle = (this.value)/10;});
    document.getElementById('neckSlide').addEventListener('mousemove', function () { g_neckAngle = (this.value)/5;});

    document.getElementById('lxSlide').addEventListener('mousemove', function () {g_lightPos[0] = (this.value)/100; renderShapes();});
    document.getElementById('lySlide').addEventListener('mousemove', function () {g_lightPos[1] = (this.value)/100; renderShapes();});
    document.getElementById('lzSlide').addEventListener('mousemove', function () {g_lightPos[2] = (this.value)/100; renderShapes();});

    //Button Events (Normal ON)
    // document.getElementById('nON').onclick = function() { g_normalON = true; }; 
    document.getElementById('nON').onclick = function() {
        if (g_normalON === false) {
            g_normalON = true;
        } else {
            g_normalON = false;
        }
    };

    //Button Events (Light ON)
    // document.getElementById('lON').onclick = function() { g_lightON = true; }; 
    document.getElementById('lON').onclick = function() {
        if (g_lightON === false) {
            g_lightON = true;
        } else {
            g_lightON = false;
        }
    };

    //Button Events (Spotlight ON)
    document.getElementById('slON').onclick = function() {
        if (g_spotlightON === false) {
            g_spotlightON = true;
        } else {
            g_spotlightON = false;
        }
    };

    //Button Events (Reset)
    document.getElementById('reset').onclick = function() { resetScene(); }; 

    //Button Event (Welcome Popup)
    document.getElementById('popup').onclick = function() { popup.style.display = 'none'; };

    //Button Event (Reference)
    document.getElementById('ref').onclick = function() {
        var img = document.getElementById('ref-img');
        if (img.style.display === 'none') {
            img.style.display = 'block';
        } else {
            img.style.display = 'none';
        }
    };

    //Button Event (Idle)
    document.getElementById('idleOFF').onclick = function() {
        if (g_posAnim === false) {
            g_posAnim = true;
        } else {
            g_posAnim = false;
        }
    };

    //Button Event (Anim1)
    document.getElementById('animON2').onclick = function() {
        if (g_headAnim === false) {
            g_headAnim = true; g_eyeAnim = true; g_legAnim = true; g_skirtAnim = true;
        } else {
            g_headAnim = false; g_eyeAnim =  false; g_legAnim = false; g_skirtAnim = false;
        }
    };

    //Button Event (Anim2)
    document.getElementById('animON1').onclick = function() {
        if (g_chestAnim === false) {
            g_chestAnim = true; g_armAnim = true; g_neckAnim = true; g_eyeAnim = true;
        } else {
            g_chestAnim = false; g_armAnim = false; g_neckAnim = false; g_eyeAnim = false;
        }
    };

    document.getElementById('webgl').addEventListener('click', function (event) {
        if (event.shiftKey) {
            // Shift-click: Enable alternate animation
            if (g_headAnim === false) {
                g_headAnim = true; g_eyeAnim = true; g_legAnim = true; g_skirtAnim = true;
            } else {
                g_headAnim = false; g_eyeAnim =  false; g_legAnim = false; g_skirtAnim = false;
            }
        } else {
            // Regular click: Enable default animation
            if (g_chestAnim === false) {
                g_chestAnim = true; g_armAnim = true; g_neckAnim = true; g_eyeAnim = true;
            } else {
                g_chestAnim = false; g_armAnim = false; g_neckAnim = false; g_eyeAnim = false;
            }
        }
    });

    // Update the colors when the hue slider is adjusted
    document.getElementById('hueSlider').addEventListener('mousemove', function () {
        g_hueShift = (this.value)/100; // Get the hue shift value from the slider
    });

    document.getElementById('lrSlide').addEventListener('mousemove', function () {
        g_lightColor[0] = (this.value)/100; 
    });

    document.getElementById('lgSlide').addEventListener('mousemove', function () {
        g_lightColor[1] = (this.value)/100; 
    });

    document.getElementById('lbSlide').addEventListener('mousemove', function () {
        g_lightColor[2] = (this.value)/100; 
    });

}

function setupSliders() {
    const sliderEvents = [
        { id: 'angSlide', variable: 'g_globalAngle', updateFn: updateGlobalRotation },
        { id: 'fpsSlide', variable: 'g_targetFPS', updateFn: (value) => setTargetFPS(value) }, // Ensure FPS is updated
        { id: 'speedSlide', variable: 'speedMultiplier', event: 'mouseup' },

        // Head Controls
        { id: 'headSlide', variable: 'g_headAngle' },

        // Body Controls
        { id: 'chestSlide', variable: 'g_chestAngle' },
        { id: 'chest2Slide', variable: 'g_chestAngleZ' },

        // Arm Controls
        { id: 'armLSlide', variable: 'g_armLAngle' },
        { id: 'armRSlide', variable: 'g_armRAngle' },

        // Leg Controls
        { id: 'thighLSlide', variable: 'g_thighLAngle' },
        { id: 'shinLSlide', variable: 'g_shinLAngle' },
        { id: 'footLSlide', variable: 'g_footLAngle' },
        { id: 'thighRSlide', variable: 'g_thighRAngle' },
        { id: 'shinRSlide', variable: 'g_shinRAngle' },
        { id: 'footRSlide', variable: 'g_footRAngle' },
    ];

    sliderEvents.forEach(({ id, variable, updateFn, event = 'input' }) => {
        const slider = document.getElementById(id);
        if (slider) {
            slider.addEventListener(event, function () {
                let value = parseFloat(this.value);
                window[variable] = value;
                if (updateFn) updateFn(value); // Pass the value explicitly
                renderShapes();
            });
        } else {
            console.warn(`Slider ${id} not found.`);
        }
    });
}

function hslToRgb(h, s, l) {
    h = h % 1; // Ensure hue wraps around
    let r, g, b;
    if (s === 0) {
        r = g = b = l; // Achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [r, g, b, 1.0];
}

function shiftColor(baseColor, hueShift, saturationShift = 0, lightnessShift = 0) {
    // Convert RGB to HSL
    const r = baseColor[0], g = baseColor[1], b = baseColor[2];
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        
        h /= 6;
    }

    // Apply shifts
    h = (h + hueShift + 1) % 1; // Wrap around and ensure positive
    s = Math.max(0, Math.min(1, s + saturationShift));
    l = Math.max(0, Math.min(1, l + lightnessShift));

    // Convert back to RGB
    return hslToRgb(h, s, l);
}