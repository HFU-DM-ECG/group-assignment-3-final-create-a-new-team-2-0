// Three JS and AR Settup

import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Defining global variables

let container, camera, scene, renderer, geometry, spaceSphere, gate, time, controller, reticle;
let portalFront, meshFront, materialFront, portalBack, meshBack, materialBack, shaderPortalFront, shaderMeshFront, shaderMaterialFront, shaderPortalBack, shaderMeshBack, shaderMaterialBack;

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
  camera.position.set(0, 0, 3);

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
  let shaderDifference = 0.00001;

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

  // Adding the Portal
  portalFront = new THREE.CircleGeometry( 1.3, 32 ); 
  materialFront = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2() },
    }
  });

  meshFront = new THREE.Mesh(portalFront, materialPhong.clone()); // Clones the predefined Phong material with full transparency
  meshFront.material.side = THREE.DoubleSide;
  meshFront.material.colorWrite = false; // Does not write the color of the Portal in the scene. The result is a hole in the background to the real world depending on the camera view
  meshFront.scale.set(0.1, 0.1, 0.1);
  meshFront.position.set(_posX, _posY, _posZ + portalDifference);
  scene.add(meshFront);


  // Adding the Portal 2
  portalBack = new THREE.CircleGeometry( 1.3, 32 ); 
  materialBack = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2() },
    }
  });

  meshBack = new THREE.Mesh(portalBack, materialPhong.clone()); // Clones the predefined Phong material with full transparency
  meshBack.material.side = THREE.DoubleSide;
  meshBack.material.colorWrite = false; // Does not write the color of the Portal in the scene. The result is a hole in the background to the real world depending on the camera view
  meshBack.scale.set(0.1, 0.1, 0.1);
  meshBack.position.set(_posX, _posY, _posZ - portalDifference);
  scene.add(meshBack);


  // Adding transparent Portal with shader in front

  shaderPortalFront = new THREE.CircleGeometry( 1.3, 32 ); 
  shaderMaterialFront = new THREE.ShaderMaterial({
  uniforms: {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2() },
  },
  vertexShader: document.getElementById("vertexShader").textContent,
  fragmentShader: document.getElementById("fragmentShader").textContent,
  });

  shaderMeshFront = new THREE.Mesh(shaderPortalFront, shaderMaterialFront); // Clones the predefined Phong material with full transparency
  shaderMeshFront.material.side = THREE.DoubleSide;
  shaderMeshFront.scale.set(0.1, 0.1, 0.1);
  shaderMeshFront.position.set(_posX, _posY, _posZ + portalDifference + shaderDifference);

  scene.add(shaderMeshFront);

  // Adding transparent Portal with shader in back

  shaderPortalBack = new THREE.CircleGeometry( 1.3, 32 ); 
  shaderMaterialBack = new THREE.ShaderMaterial({
  uniforms: {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2() },
  },
  vertexShader: document.getElementById("vertexShader").textContent,
  fragmentShader: document.getElementById("fragmentShader").textContent,
  });

  shaderMeshBack = new THREE.Mesh(shaderPortalBack, shaderMaterialBack); // Clones the predefined Phong material with full transparency
  shaderMeshBack.material.side = THREE.DoubleSide;
  shaderMeshBack.scale.set(0.1, 0.1, 0.1);
  shaderMeshBack.position.set(_posX, _posY, _posZ - portalDifference - shaderDifference);

  scene.add(shaderMeshBack);
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
  if(gate && meshFront && shaderMeshFront && spaceSphere && xenon_Gate_Loaded == true && space_Loaded == true){ // Check if models are loaded.
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
    animateObject(gate.children[1], 1, 1, 0, -1.5*time, "rotation"); // Rotate Inner Ring. gate.children[0] is the Outer ring of the Gate model. gate.children[1] is the inner ring.
    animateObject(gate, 1, 1, 0, time, "position"); // Move Gate up and down
    animateObject(meshFront, 1, 1, 0, time, "position"); // Move Portal up and down
    animateObject(meshFront, 1, 1, 0, time, "rotation"); // Rotate Portal
    animateObject(meshFront, 1, 0.005, 0, 0.15*time, "scale"); // Adjust size of the Portal
    animateObject(meshBack, 1, 1, 0, time, "position"); // Move Portal up and down
    animateObject(meshBack, 1, 1, 0, time, "rotation"); // Rotate Portal
    animateObject(meshBack, 1, 0.005, 0, 0.15*time, "scale"); // Adjust size of the Portal
    animateObject(shaderMeshFront, 1, 1, 0, time, "position"); // Move Portal up and down
    animateObject(shaderMeshFront, 1, 1, 0, time, "rotation"); // Rotate Portal
    animateObject(shaderMeshFront, 1, 0.005, 0, 0.15*time, "scale"); // Adjust size of the Portal
    animateObject(shaderMeshBack, 1, 1, 0, time, "position"); // Move Portal up and down
    animateObject(shaderMeshBack, 1, 1, 0, time, "rotation"); // Rotate Portal
    animateObject(shaderMeshBack, 1, 0.005, 0, 0.15*time, "scale"); // Adjust size of the Portal
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
  
  shaderMaterialFront.uniforms.uTime.value += 0.01; // increasing the Time variable each frame
  shaderMaterialFront.uniforms.uResolution.value.set(
    renderer.domElement.width,
    renderer.domElement.height
  );

  renderer.render( scene, camera );
}