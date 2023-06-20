// Three JS and AR Setup

import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Import shaders from other files

import vertTransparentPortal from "./shader/transparentPortal/vertexShader.js";
import fragTransparentPortal from "./shader/transparentPortal/fragmentShader.js";

// Shader for the old portal where the scene got rendered on the material of the portal (wip: we don't use this approach anymore)
// import vertDimensionPortal from "./shader/dimensionPortal/vertexShader.js";
// import fragDimensionPortal from "./shader/dimensionPortal/fragmentShader.js";

// Defining global variables
let container, camera, scene, light, renderer, geometry, spaceSphere, gate, time, controller, reticle;

// Defining hit variables
let hitFrontOut, hitFrontIn, hitBackOut, hitBackIn, hitCenter; 

// Defining portal variables
let portalFront, meshFront, portalBack, meshBack, realMat, spaceMat;


// Defining booleans for switching the material
let world_material = false;
let portalFront_material = true;
// let portalBack_material = false;
let cameFromFront = false;
let cameFromBack = false;


let stencilRef = 1;

// LoadingManager

const manager = new THREE.LoadingManager();
manager.onStart = function ( url, itemsLoaded, itemsTotal ) {
  console.log( 'Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
};

// Setting loading variables. Prevents errors from calling the animate function while the models are not jet loaded.
let models_Loaded = false;


// Loading Manager sets models Loaded to true so the animation won't start before every model is loaded.
manager.onLoad = function (url){
    models_Loaded = true;
    console.log( 'Loading complete!');
};

// Check of all loaded files during progress.
manager.onProgress = function ( url, itemsLoaded, itemsTotal ) {
    console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
};

// Print error if any objects aren't loaded yet.
manager.onError = function ( url ) {
    console.log( 'There was an error loading ' + url );
};

let modelLoader = new GLTFLoader(manager);

// HitTest settup
let hitTestSource = null;
let hitTestSourceRequested = false;
let xr_mode = "xr";

// Random Model array
let randomModels = [
"./assets/models/portalmodel.glb", 
"./assets/models/star_of_sun.glb", 
"./assets/models/mercury_planet.glb", 
"./assets/models/purple_planet.glb",
"./assets/models/saturn_planet.glb",
"./assets/models/death_row_spaceship.glb", 
"./assets/models/intergalactic_spaceship_only_model.glb", 
"./assets/models/spaceship.glb",
"./assets/models/pod.glb"
]

init(); // Call Init function for main settup

async function init() {

    container = document.createElement( 'div' );
    document.body.appendChild( container );

    // Scene Setup
    scene = new THREE.Scene();

    // Camera Setup
    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 20 );
    camera.position.set(0, 0, 1);

    // Light Setup
    light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(0, 10, 0);
    scene.add(light);

    // Render Setup: Sets the WebGLRenderer with antialias, alpha and premultiplied alpha on true. It initializes the size, pixelratio and enables the xr mode.
    renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true, premultipliedAlpha: false} );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.xr.enabled = true;
    container.appendChild( renderer.domElement );

    // Creates the buttons in the html div and add event listener to switch between the xr mode ar and vr.
    document.getElementById("buttonContainer").appendChild( ARButton.createButton( renderer, { requiredFeatures: [ 'hit-test' ] } ) );
    document.getElementById("buttonContainer").appendChild( VRButton.createButton( renderer ) );
    document.getElementById("ARButton").addEventListener("click", () => xr_mode = "ar");
    document.getElementById("VRButton").addEventListener("click", () => xr_mode = "vr");

    // Call add Objects function to place all needed objects in the world before continuing
    await addObjects(); 

    // Call animate function. Will loop with empty results while the models are still loading
    animate(); 

    // Adjust the window if it gets resized
    window.addEventListener( 'resize', onWindowResize );
}

// Adding the static objects
async function addObjects() { 

    // Adding the Skybox
    spaceSphere = new THREE.Object3D();
    modelLoader.load('./assets/models/space_Sphere.gltf', function (gltf) { // GLTF loader
      spaceSphere = gltf.scene;
      spaceSphere.name = "spaceSphere";
      spaceSphere.position.set(0, 0, 0);
      spaceSphere.scale.set(1, 1, 1);
      spaceSphere.rotation.set(5, 5, 5);
      scene.add(spaceSphere);
    }, undefined, function (error) {
      console.error(error);
    })

    // Generate Portal with the given coordinates
    generatePortal(0, 0, -0.8);

    // Random Planet or Star Spawner
    geometry = new THREE.Object3D();
        // This function gets called if you tap the screen.
        function onSelect() {

            // Places a random model with random properties if the hitmarker is visible (means it found an intersection in the real world)
            if ( reticle.visible ) {
                let randomScale = Math.random() * 0.1;
                let randomRotate = Math.random() * 360;

                geometry = new THREE.Object3D();
                    modelLoader.load(randomModels[Math.floor(Math.random() * randomModels.length)], function (gltf) {
                        geometry.add(gltf.scene.children[0]);
                        geometry.name = "random_model";
                        reticle.matrix.decompose( geometry.position, geometry.quaternion, geometry.scale );

                        geometry.scale.set(randomScale, randomScale, randomScale);
                        geometry.rotation.set(randomRotate, randomRotate, randomRotate);
                        scene.add(geometry);
                }, undefined, function (error) {
                    console.error(error);
                })
            }
        }

        // Sets the xr controller (screen tap) and add the function to be called if gets triggered
        controller = renderer.xr.getController( 0 );
        controller.addEventListener( 'select', onSelect );
        scene.add( controller );

        // Creates the hitmarker object that is hidden in the beginning
        reticle = new THREE.Mesh(
          new THREE.RingGeometry( 0.15, 0.2, 32 ).rotateX( - Math.PI / 2 ),
          new THREE.MeshBasicMaterial()
        );
        reticle.matrixAutoUpdate = false;
        reticle.visible = false;
        scene.add( reticle );
}

// Function to create multiple layers of the Portal (wip: one portal because the stencil breaks the second portal and we couldn't fix it)
function generatePortal(_posX, _posY, _posZ) {
    // sets a difference between the multiple layers (wip: because we have just one portal we don't need a difference and place it right in the middle)
    let portalDifference = 0.0;

    // Adding the gate model
    gate = new THREE.Object3D();
    modelLoader.load('./assets/models/xenon_Gate.gltf', function (gltf) { // GLTF loader
        gate = gltf.scene;
        gate.name = "gate";
        gate.position.set(_posX, _posY, _posZ);
        gate.scale.set(0.4, 0.4, 0.4);
        // gate has two objects. gate.children[0] = Outer Ring, gate.children[1] = Inner Ring
        scene.add(gate); 
    }, undefined, function (error) {
        console.error(error);
    })

    // Adding front portal with shader for wobble portal effects (wip: creates two different materials so we can switch between them later and initialize the real world)
    portalFront = new THREE.CircleGeometry( 1.3, 32 ); 

    // Real world shader with wobble effects which doesn't render the material so nothing gets rendered here and we can look through into the real world
    realMat = new THREE.ShaderMaterial({
    uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2() },
    },
    vertexShader: vertTransparentPortal,
    fragmentShader: fragTransparentPortal,
    });

    // Disables the stencils in case it gets switched back again so it gets deactivated
    realMat.depthWrite = true;
    realMat.stencilWrite = false;
    realMat.stencilFunc = THREE.AlwaysStencilFunc;
    realMat.stencilZPass = THREE.ReplaceStencilOp;


    // Space material with activated stencil so it creates a stencil of this shape on another object (in this case in stencils the skybox so only the stencil is visible on this material, but not the rest)
    // It gets often used for portal effects: 
    // "Other rendering techniques, such as portal rendering, use the stencil buffer in other ways; for example, it can be used to find the area of the screen obscured by a portal and re-render those pixels correctly."
    // see https://en.wikipedia.org/wiki/Stencil_buffer () and https://en.wikipedia.org/wiki/Portal_rendering
    spaceMat = new THREE.MeshBasicMaterial({color: 0xffffff});

    spaceMat.depthWrite = false;
    spaceMat.stencilWrite = true;
    spaceMat.stencilRef = stencilRef;
    spaceMat.stencilFunc = THREE.AlwaysStencilFunc;
    spaceMat.stencilZPass = THREE.ReplaceStencilOp;

    meshFront = new THREE.Mesh(portalFront, realMat); // Clones the predefined Phong material with full transparency
    meshFront.material.side = THREE.DoubleSide;
    meshFront.scale.set(0.16, 0.16, 0.16);
    meshFront.position.set(_posX, _posY, _posZ + portalDifference);

    scene.add(meshFront);


    // Portal in the back with little difference so you could stay between both and look into both dimensions. (wip: its now deactivated because the effect didn't worked as we intended)
    portalBack = new THREE.CircleGeometry( 1.3, 32 ); 

    meshBack = new THREE.Mesh(portalBack, spaceMat); // Clones the predefined Phong material with full transparency
    meshBack.material.side = THREE.DoubleSide;
    meshBack.scale.set(0.16, 0.16, 0.16);
    meshBack.position.set(_posX, _posY, _posZ - portalDifference);

    // scene.add(meshBack);

    // Adding Hitboxes so it switches the materials of the portals and skybox right (depending which direction you came from)
    hitFrontOut = new THREE.Object3D();
    modelLoader.load('./assets/models/hitbox.glb', function (gltf) { // GLTF loader
        hitFrontOut  = gltf.scene;
        hitFrontOut.name = "hitFrontOut";
        hitFrontOut.position.set(_posX, _posY, _posZ + 0.02);
        hitFrontOut.scale.set(1, 1, 2);    
        hitFrontOut.traverse((object)=>{
            if(object.material){
                object.material.transparent = true;
                object.material.opacity = 0.1;
                object.material.side = THREE.DoubleSide;
            }
        });
        scene.add(hitFrontOut);
        }, undefined, function (error) {
            console.error(error);
        })

    hitBackOut = new THREE.Object3D();
    modelLoader.load('./assets/models/hitbox.glb', function (gltf) { // GLTF loader
        hitBackOut  = gltf.scene;
        hitBackOut.name = "hitBackOut";
        hitBackOut.position.set(_posX, _posY, _posZ - 0.02);
        hitBackOut.scale.set(1, 1, 2);    
        hitBackOut.traverse((object)=>{
            if(object.material){
                object.material.transparent = true;
                object.material.opacity = 0.1;
                object.material.side = THREE.DoubleSide;
            }
        });
        scene.add(hitBackOut);
        }, undefined, function (error) {
            console.error(error);
        })

    hitCenter = new THREE.Object3D();
    modelLoader.load('./assets/models/hitbox.glb', function (gltf) { // GLTF loader
        hitCenter  = gltf.scene;
        hitCenter.name = "hitCenter";
        hitCenter.position.set(_posX, _posY, _posZ);
        hitCenter.scale.set(1, 1, 5);    
        hitCenter.traverse((object)=>{
            if(object.material){
                object.material.transparent = true;
                object.material.opacity = 0.0;
                object.material.side = THREE.DoubleSide;
            }
        });
        scene.add(hitCenter);
        }, undefined, function (error) {
            console.error(error);
        })


   

}

// Object Animation function with given attributes to get the wished animation
function animateObject(object, freq, amplitude, delay, currentTime, transform) { 
    switch (transform) { // Input of the "transform" variable. Changes the animation type depending on the input
        case "position": // Change in Position
            window.setTimeout(() => {
            var midPosition = object.position.y;
            object.position.y = midPosition + (Math.sin(currentTime * freq) * amplitude * 0.001);
            }, delay);
        break;
        case "rotation": // Change in Rotation
        window.setTimeout(() => {
            object.rotation.z = currentTime / 2;
        }, delay);
        break;
        case "scale": // Change in Scale
        window.setTimeout(() => {
            object.scale.set((Math.sin(currentTime * freq) * amplitude) + 0.08, (Math.sin(currentTime * freq) * amplitude) + 0.08, 0);
        }, delay);
        break;
        default:
        break;
    }

}

// Resizing the window refreshes the scene with new aspect ratio
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}

// animate Function (calls the "animateObject" function with given attributes)
function animate() {
    // Checks if models are loaded and then starts the animation so all animations are synced.
    if(models_Loaded == true){ 
        const currentTime = Date.now() / 1000; 
        time = currentTime;

        // Changes the colors of the gate with help of the sinus and cosinus curves.
        gate.traverse( function( child ) {
        if ( child instanceof THREE.Mesh ) { 
            child.material.emissiveIntensity = Math.sin(time)*0.2+1.3; // Adjust brightness of the emission map.
            const emissiveR = Math.floor((((Math.cos(time)+1)/2)*255)); // Cycles through values from 0 to 255 for red.
            const emissiveG = Math.floor((((Math.sin(time)+1)/2)*255)); // Cycles through values from 0 to 255 for green.
            const emissiveB = Math.floor((((Math.cos(time+77.0)+1)/2)*255)); // Cycles through values from 0 to 255 for blue.
            const emissiveRGB = "rgb(" + emissiveR + "," + emissiveG + "," + emissiveB + ")" ; // Combines the R, G and B values into one variable.
            child.material.emissive = new THREE.Color(emissiveRGB); // Adjust Color based on the RGB value.
            }
        } );

        // Animations for the gate model
        animateObject(gate.children[1], 1, 1, 0, -0.5 * time, "rotation"); // Rotate Inner Ring. gate.children[0] is the Outer ring of the Gate model. gate.children[1] is the inner ring.
        animateObject(gate, 1, 0.3, 0, time, "position"); // Move Gate up and down

        // Animations for the front portal
        animateObject(meshFront, 1, 0.3, 0, time, "position"); // Move Portal up and down
        animateObject(meshFront, 1, 1, 0, time, "rotation"); // Rotate Portal
        // animateObject(meshFront, 1, 0.005, 0, 0.5 * time, "scale"); // Adjust size of the Portal

        // Animation for the portal in the back (wip: we don't use the portal right now so we don't need the animations right now)
        // animateObject(meshBack, 1, 1, 0, time, "position"); // Move Portal up and down
        // animateObject(meshBack, 1, 0.005, 0, 0.15*time, "scale"); // Adjust size of the Portal

        // Animations for the hitboxes
        animateObject(hitFrontOut, 1, 0.3, 0, time, "position");
        animateObject(hitBackOut, 1, 0.3, 0, time, "position"); 
        animateObject(hitCenter, 1, 0.3, 0, time, "position");

        // Checks the position of the camera and the intersection with the hitboxes so it can switch the portals right in the next line
        checkIntersection();
        switchPortals();
    } 

    // Renders the scene and the camera
    renderer.render( scene, camera );

    // Sets the animation loop with the render function and request the animationframes with the animate function
    requestAnimationFrame(animate);
    renderer.setAnimationLoop( render );
}

// Checks the intersection with the hitboxes: It shoots raycasts and checks how many intersections it gets to find out where the camera is and from what direction it came from
function checkIntersection (){
    const raycaster = new THREE.Raycaster();

    raycaster.set(camera.position, new THREE.Vector3(1,1,1));
    const intersectsFrontOut = raycaster.intersectObject(hitFrontOut);
    if (intersectsFrontOut.length %2 ===1) {
        if(world_material==true){
            cameFromFront = false;
        };
        if(world_material==false){
            cameFromFront = true;
        };
        hitFrontOutLogic();
    }
    const intersectsBackOut = raycaster.intersectObject(hitBackOut);
    if (intersectsBackOut.length %2 ===1) {
        if(world_material==true){
            cameFromBack = false;
        };
        if(world_material==false){
            cameFromBack = true;
        };
        hitBackOutLogic();
    }
    const intersectsCenter = raycaster.intersectObject(hitCenter);
    if (intersectsCenter.length %2 ===1) {
        hitCenterLogic();
        console.log('camera is near the Portal');
    }

    if(intersectsCenter.length %2 !==1 && intersectsBackOut.length %2 !==1 && intersectsFrontOut.length %2 !==1) {
        resetLogic();
    }


}

function hitFrontOutLogic(){
  
    if(cameFromBack==false && cameFromFront == false){
        world_material = false;
        portalFront_material = true;
    };
    if(cameFromBack==true && cameFromFront == true){
        world_material = true;
        portalFront_material = false;
    };
}

function hitBackOutLogic(){
    if(cameFromBack==false && cameFromFront == false){
        world_material = false;
        portalFront_material = true;
    };
    if(cameFromBack==true && cameFromFront == true){
        world_material = true;
        portalFront_material = false;
    };
}

function hitCenterLogic(){
    console.log('cameFromBack ' + cameFromBack);
    console.log('cameFromFront ' + cameFromFront);
    console.log('Portal ' + portalFront_material);
}

function resetLogic(){
    console.log('resetting Logic');
    if(world_material==true){
        cameFromFront = true;
        cameFromBack = true;
        portalFront_material = false;
    };
    if(world_material==false){
        cameFromFront = false;
        cameFromBack = false;
        portalFront_material = true;
    };
}

// Switches the materials of the skyshpere and the portal depending what boolean is set.
function switchPortals() {

    if (world_material == false) {
        spaceSphere.traverse( function( child ) {
            if ( child instanceof THREE.Mesh ) { 
                child.material.stencilWrite = true;
                child.material.stencilRef = stencilRef;
                child.material.stencilFunc = THREE.EqualStencilFunc;
                }
            } );
    } else {
        spaceSphere.traverse( function( child ) {
            if ( child instanceof THREE.Mesh ) { 
                child.material.stencilWrite = false;
                child.material.stencilRef = stencilRef;
                child.material.stencilFunc = THREE.EqualStencilFunc;
                }
            } );
    }

    if ( portalFront_material == true ) {
        meshFront.material = spaceMat;
        meshFront.material.side = THREE.DoubleSide;
    } else {
        meshFront.material = realMat;
        meshFront.material.side = THREE.DoubleSide;
    }

    // Not in use right now
    // if ( portalBack_material == true ) {
    //     meshBack.material = spaceMat;
    //     meshBack.material.side = THREE.DoubleSide;
    // } else {
    //     meshBack.material = realMat;
    //     meshBack.material.side = THREE.DoubleSide;
    // }

}


// Render function
function render( timestamp, frame ) {
    // Checks if the ar mode is on, because the hittest doesn't work in vr. (We couldn't fix it, if we got it right it's because the hittest in vr works different)
    if (xr_mode == "ar") {  

    // Checks every frame if it found an intersection with realworld surfaces
        if ( frame ) {
            const referenceSpace = renderer.xr.getReferenceSpace();
            const session = renderer.xr.getSession();

            if ( hitTestSourceRequested === false ) {
                session.requestReferenceSpace( 'viewer' ).then( function ( referenceSpace ) {
                session.requestHitTestSource( { space: referenceSpace } ).then( function ( source ) {
                    hitTestSource = source;
                } );
                } );
                session.addEventListener( 'end', function () {
                hitTestSourceRequested = false;
                hitTestSource = null;
                } );
                hitTestSourceRequested = true;
            }

            // If it found an intersection it makes the hitmarker visible and gets the position result of the found coordinates so we can place objects there
            if ( hitTestSource ) {
                const hitTestResults = frame.getHitTestResults( hitTestSource );
                if ( hitTestResults.length ) {
                const hit = hitTestResults[ 0 ];
                reticle.visible = true;
                reticle.matrix.fromArray( hit.getPose( referenceSpace ).transform.matrix );
                } else {
                reticle.visible = false;
                }
            }
        }
    }
    
    // set the values of the uniforms for the shader to animate it
    realMat.uniforms.uTime.value += 0.01; 
    realMat.uniforms.uResolution.value.set(
        renderer.domElement.width,
        renderer.domElement.height
    );

    // render scene and camera
    renderer.render( scene, camera );
}