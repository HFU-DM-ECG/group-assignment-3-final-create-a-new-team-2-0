// Three JS and AR Settup

import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import vertTransparentPortal from "./shader/transparentPortal/vertexShader.js";
import fragTransparentPortal from "./shader/transparentPortal/fragmentShader.js";

import vertDimensionPortal from "./shader/dimensionPortal/vertexShader.js";
import fragDimensionPortal from "./shader/dimensionPortal/fragmentShader.js";

let loader = new THREE.TextureLoader();
let texture = loader.load('./assets/images/uv.jpg');

// Defining global variables

let container, camera, scene, renderer, geometry, spaceSphere, gate, time, controller, reticle;
let portalFront, meshFront, materialFront, portalBack, meshBack, materialBack;

// LoadingManager. Work in Progress

const manager = new THREE.LoadingManager();

// Setting loading variables. Prevents errors from calling the animate function while the models are not jet loaded.

let xenon_Gate_Loaded = false;
let space_Loaded = false;

var materialPhong = new THREE.MeshPhongMaterial();

manager.onLoad = function (url){
  if (url == './assets/models/xenon_Gate.gltf')
    {
      xenon_Gate_Loaded = true;
    }
  if (url == './assets/models/space_Sphere.gltf')
    {
      space_Loaded = true;
    }
};

// HitTest settup

let modelLoader = new GLTFLoader(manager);

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

  // Scene Settup

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 20 );
  camera.position.set(0, 0.2, -0.1);

  const light = new THREE.DirectionalLight(0xffffff, 2);
  light.position.set(0, 10, 0);
  scene.add(light);

  // Render Settup

  renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true, premultipliedAlpha: false} );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.xr.enabled = true;
  container.appendChild( renderer.domElement );

  // User Interface

  document.getElementById("buttonContainer").appendChild( ARButton.createButton( renderer, { requiredFeatures: [ 'hit-test' ] } ) );
  document.getElementById("buttonContainer").appendChild( VRButton.createButton( renderer ) );
  document.getElementById("ARButton").addEventListener("click", () => xr_mode = "ar");
  document.getElementById("VRButton").addEventListener("click", () => xr_mode = "vr");
  

  await addObjects(); // Call add Objects function
  animate(); // Call animate function. Will loop with empty results while the models are still loading

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
      space_Loaded = true; // Set variable to true as soon as the model has been loaded. See animate function
    }, undefined, function (error) {
      console.error(error);
    })

    // Generate Portal
    generatePortal(0, 0.2, -0.3);

    // Random Planet or Star Spawner

    geometry = new THREE.Object3D();
				function onSelect() {

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

				controller = renderer.xr.getController( 0 );
				controller.addEventListener( 'select', onSelect );
				scene.add( controller );

				reticle = new THREE.Mesh(
					new THREE.RingGeometry( 0.15, 0.2, 32 ).rotateX( - Math.PI / 2 ),
					new THREE.MeshBasicMaterial()
				);
				reticle.matrixAutoUpdate = false;
				reticle.visible = false;
				scene.add( reticle );
}

// Function to create multiple layers of the Portal

function generatePortal(_posX, _posY, _posZ) {
  let portalDifference = 0.00001;

  // Adding the Gate model

  gate = new THREE.Object3D();
  modelLoader.load('./assets/models/xenon_Gate.gltf', function (gltf) { // GLTF loader
    gate = gltf.scene;
    gate.name = "gate";
    gate.position.set(_posX, _posY, _posZ);
    gate.scale.set(0.2, 0.2, 0.2);
    scene.add(gate); // gate has two objects. gate.children[0] = Outer Ring, gate.children[1] = Inner Ring
    xenon_Gate_Loaded = true; // Set variable to true as soon as the model has been loaded. See animate function
  }, undefined, function (error) {
    console.error(error);
  })

  // Adding transparent Portal with shader in front

  portalFront = new THREE.CircleGeometry( 1.3, 32 ); 
  materialFront = new THREE.ShaderMaterial({
  uniforms: {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2() },
  },
  vertexShader: vertTransparentPortal,
  fragmentShader: fragTransparentPortal,
  });

  meshFront = new THREE.Mesh(portalFront, materialFront); // Clones the predefined Phong material with full transparency
  meshFront.material.side = THREE.DoubleSide;
  meshFront.scale.set(0.1, 0.1, 0.1);
  meshFront.position.set(_posX, _posY, _posZ + portalDifference);

  // scene.add(meshFront);

  // Adding transparent Portal with shader in back
  camera.updateProjectionMatrix()
  camera.updateMatrixWorld()
  camera.updateWorldMatrix()

  // get the matrices from the camera so they're fixed in camera's original position
  const viewMatrixCamera = camera.matrixWorldInverse.clone()
  const projectionMatrixCamera = camera.projectionMatrix.clone()
  const modelMatrixCamera = camera.matrixWorld.clone()

  const projPosition = camera.position.clone()

  portalBack = new THREE.CircleGeometry( 1.3, 32 ); 
  materialBack = new THREE.ShaderMaterial({
  uniforms: {
      uTime: { value: 0 },
      color: { value: new THREE.Color(0xffffff) },
      uTexture: { value: texture },
      viewMatrixCamera: { type: 'm4', value: viewMatrixCamera },
      projectionMatrixCamera: { type: 'm4', value: projectionMatrixCamera },
      modelMatrixCamera: { type: 'mat4', value: modelMatrixCamera },
      projPosition: { type: 'v3', value: projPosition },
  },
  vertexShader: vertDimensionPortal,
  fragmentShader: fragDimensionPortal,
  });

  meshBack = new THREE.Mesh(portalBack, materialBack); // Clones the predefined Phong material with full transparency
  meshBack.material.side = THREE.DoubleSide;
  meshBack.scale.set(0.1, 0.1, 0.1);
  meshBack.position.set(_posX, _posY, _posZ - portalDifference);

  scene.add(meshBack);
}

// Object Animation function

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

// animate Function. (Calls the "animateObject" function with input)

function animate() {
  if(gate && meshFront && meshFront && spaceSphere && xenon_Gate_Loaded == true && space_Loaded == true){ // Check if models are loaded.
    const currentTime = Date.now() / 1000; 
    time = currentTime;

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

    // Jumps to here if the models are not jet loaded
    // animateObject(gate.children[1], 1, 1, 0, -1.5*time, "rotation"); // Rotate Inner Ring. gate.children[0] is the Outer ring of the Gate model. gate.children[1] is the inner ring.
    // animateObject(gate, 1, 1, 0, time, "position"); // Move Gate up and down
    // animateObject(meshFront, 1, 1, 0, time, "position"); // Move Portal up and down
    // animateObject(meshFront, 1, 1, 0, time, "rotation"); // Rotate Portal
    // animateObject(meshFront, 1, 0.005, 0, 0.15*time, "scale"); // Adjust size of the Portal
    // animateObject(meshBack, 1, 1, 0, time, "position"); // Move Portal up and down
    // animateObject(meshBack, 1, 0.005, 0, 0.15*time, "scale"); // Adjust size of the Portal
  } 

  requestAnimationFrame(animate);
  renderer.setAnimationLoop( render );
}

// Render function

function render( timestamp, frame ) {
  if (xr_mode == "ar") {  
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
  
  materialFront.uniforms.uTime.value += 0.01; // increasing the Time variable each frame
  materialFront.uniforms.uResolution.value.set(
    renderer.domElement.width,
    renderer.domElement.height
  );

  materialBack.uniforms.uTime.value += 0.01; // increasing the Time variable each frame

  materialBack.uniforms.viewMatrixCamera.value = camera.matrixWorldInverse.clone();
  materialBack.uniforms.projectionMatrixCamera.value = camera.projectionMatrix.clone();
  materialBack.uniforms.modelMatrixCamera.value = camera.matrixWorld.clone();
  materialBack.uniforms.projPosition.value = camera.position.clone();

  renderer.render( scene, camera );
}