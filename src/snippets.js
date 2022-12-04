import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { gsap } from 'gsap';


let scene, camera, renderer, selectedObject;
let fieldGroup;
let composer, effectFXAA, outlinePass;

let loadingPercentage, loadingPercentageText;

let selectedObjects = [];

// LOADING MANAGER
const manager = new THREE.LoadingManager( () => {
    const loadingScreen = document.getElementById( 'loading-screen' );
    loadingScreen.classList.add( 'fade-out' );
    // optional: remove loader from DOM via event listener
    loadingScreen.addEventListener( 'transitionend', onTransitionEnd );
});
manager.onProgress = function ( url, itemsLoaded, itemsTotal ) {
    loadingPercentage = Math.round((itemsLoaded/itemsTotal)) * 100;
    // console.log(loadingPercentage)
    document.getElementById("loading-percentage").innerHTML = "loading " + loadingPercentage + "%";
    // console.log(loadingPercentageText);
    // loadingPercentageText.innerHTML = loadingPercentage;
       // console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
}
function onTransitionEnd( event ) {
    event.target.remove();
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const clock = new THREE.Clock();

const loader = new GLTFLoader(manager);

window.addEventListener('resize', onWindowResize, false);

init();
animate();

// function createFieldScene(){

//     fieldGroup = new THREE.Group();

//     // Adding lighting
//     const fieldAmbientLight = new THREE.AmbientLight( 'white', 0 );
//     const fieldDirectionalLight = new THREE.DirectionalLight( 'yellow', 0);
//     fieldDirectionalLight.position.set(3, 4, 3);

//     // ANIMATED GRASS
//     const instanceNumber = config.instanceNumber;
//     const dummy = new THREE.Object3D();
//     loader.load( 'assets/ground_plane_only2.glb', function ( gltf ) {

//         const model = gltf.scene;
//         const ground = model.children[0];
//         model.position.set( 0, 0, -21.5 );
//         fieldGroup.add( model );
//         console.log(model)

//         const vertexCount = model.children[0].geometry.getAttribute( 'position' ).count;
//         let weight_unscaled = new Float32Array(vertexCount);
//         let weight = new Float32Array(vertexCount);
//         let xpos = new Array();
//         let ypos = new Array();
//         let zpos = new Array();
//         for (let i=0; i<vertexCount*3; i++){
//             if (i%3 == 0){
//                 xpos.push(model.children[0].geometry.attributes.position.array[i]);
//             } else if (i%3 == 1){
//                 ypos.push(model.children[0].geometry.attributes.position.array[i]);
//             } else {
//                 zpos.push(model.children[0].geometry.attributes.position.array[i]);
//             }
//         }
//         let pointpos;
//         for (let i=0; i<vertexCount; i++){
//             pointpos = new THREE.Vector3(xpos[i] - camera.position.x, 0, zpos[i] - camera.position.z - 21.5);
//             weight_unscaled[i] = pointpos.lengthSq();
//         }
//         let normalizer = Math.max.apply(null, weight_unscaled);
//         for (let i=0; i<vertexCount; i++){
//             weight[i] = weight_unscaled[i] / normalizer;
//             weight[i] = 1 - weight[i];
//             if (weight[i] < 0.7){
//                 weight[i] = 0;
//             }
//         }
//         console.log(Math.max.apply(null, weight));
//         console.log(Math.min.apply(null, weight));
//         model.children[0].geometry.setAttribute( 'weight', new THREE.BufferAttribute( weight, 1 , true).setUsage( THREE.DynamicDrawUsage ) );

//         const sampler = new MeshSurfaceSampler(model.children[0]).setWeightAttribute('weight').build();

//         const tempPosition = new THREE.Vector3();
//         const geometry = new THREE.PlaneGeometry( 0.5, 0.5, 1, 4 );
//         geometry.translate( 0, 0.25, 0 );
    
//         const instancedMesh = new THREE.InstancedMesh( geometry, leavesMaterial, instanceNumber );
    
//         fieldGroup.add( instancedMesh );

//         for ( let i=0 ; i<instanceNumber ; i++ ) {
//             sampler.sample(tempPosition);
//             dummy.position.x = tempPosition.x;
//             dummy.position.y = tempPosition.y;
//             dummy.position.z = tempPosition.z -21.5;
        
//         dummy.scale.setScalar( 1 + Math.random() * 1.5 );
        
//         // dummy.rotation.y = Math.random() * Math.PI;
//         dummy.rotation.y = Math.PI;
        
//         dummy.updateMatrix();
//         instancedMesh.setMatrixAt( i, dummy.matrix );
    
//         }

//     }, undefined, function ( e ) {

//         console.error( e );

//     } );

//     fieldGroup.add( fieldAmbientLight, fieldDirectionalLight );

//     // skybox
//     const skybox_loader = new THREE.CubeTextureLoader();
//     const skybox_texture = skybox_loader.load([
//     'img/night_right.png',
//     'img/night_left.png',
//     'img/night_up.png',
//     'img/night_down.png',
//     'img/night_back.png',
//     'img/night_front.png',
//     ]);
//     scene.background = skybox_texture;

//     // AUDIO
//     var audioLoader = new THREE.AudioLoader(manager);
//     var listener = new THREE.AudioListener();
//     var audio = new THREE.Audio(listener);
//     audioLoader.load('audio/scott-buckley-i-walk-with-ghosts.mp3', function(buffer) {
//         audio.setBuffer(buffer);
//         audio.setLoop(true);
//         audio.play();
//     });

//     scene.add( fieldGroup );
// }


// function createRoomScene(){

//     // create field scene group (represents the GLTF scene import for now, I'll explain if you have questions)
//     roomGroup = new THREE.Group();
//     roomGroup.position.set(0, 0, 0);

//     // Adding lighting
//     const roomAmbientLight = new THREE.AmbientLight( 'white', 0.4 );
//     const roomDirectionalLight = new THREE.DirectionalLight( 'yellow', 0.8);
//     roomDirectionalLight.position.set(3, 4, 3);

//     // build doors with a lazy layout - doors will need specific names in your 3D model scene
//     const wallGeometry = new THREE.BoxGeometry( 6, 6, 1 );
//     const wallMaterial = new THREE.MeshLambertMaterial({
//         color: 'blue',
//     });
//     const wallMesh1 = new THREE.Mesh(wallGeometry, wallMaterial );
//     const wallMesh2 = new THREE.Mesh(wallGeometry, wallMaterial );
//     const wallMesh3 = new THREE.Mesh(wallGeometry, wallMaterial );
//     const wallMesh4 = new THREE.Mesh(wallGeometry, wallMaterial );
//     wallMesh1.position.set(0, 3, 4);
//     wallMesh2.position.set(0, 3, -4);
//     wallMesh3.position.set(4, 3, 0);
//     wallMesh3.rotation.y = Math.PI * 0.5;
//     wallMesh4.position.set(-4, 3, 0);
//     wallMesh4.rotation.y = Math.PI * 0.5;

//     roomGroup.add( roomAmbientLight, roomDirectionalLight, wallMesh1, wallMesh2, wallMesh3, wallMesh4 );

//     roomGroup.visible = false;
// }


// function fieldSceneControls(){
//     // these are the view controls when you are in the field.
//     camera.rotation.y += 0.03 * ( - ( mouse.x * .15 ) - camera.rotation.y );
//     camera.rotation.x += 0.03 * ( (mouse.y * .15) - camera.rotation.x );
//     camera.rotation.z = 0;
// }


// function roomSceneControls(){
//     // new controls while in a room, so you can look 360.
//     camera.rotation.y += 0.03 * ( - ( mouse.x * 7 ) - camera.rotation.y );
//     camera.rotation.x += 0.03 * ( (mouse.y * 1) - camera.rotation.x );
//     camera.rotation.z = 0
// }


// function addSelectedObject( object ) {

//     selectedObjects = [];
//     selectedObjects.push( object );

// }


function castingRay() {

    raycaster.setFromCamera( mouse, camera );

    const intersects = raycaster.intersectObject( scene, true );

    // if ( intersects.length > 0 ) {

    //     selectedObject = intersects[ 0 ].object;
    //     addSelectedObject( selectedObject );
    //     outlinePass.selectedObjects = selectedObjects;
    //     document.addEventListener( 'click', onDoorClick, false);

    // } else {

    //     outlinePass.selectedObjects = [];
    //     document.removeEventListener( 'click', onDoorClick);
    // }
}


function init() {

    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.01, 50 );
    camera.position.z = 1;
    camera.position.y = 0.9;

    // this is needed for normal camera looking, otherwise it goes fucked.
    camera.rotation.order = 'YXZ'

    scene = new THREE.Scene();

    const room = loader.load('assets/home_office_90s_baked_curtains.glb', function(gltf) {
        const model = gltf.scene;
        scene.add(model);
    });

    //renderer
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // postprocessing
    composer = new EffectComposer( renderer );
    const renderPass = new RenderPass( scene, camera );
    composer.addPass( renderPass );

    //raycaster layers
    raycaster.layers.set( 1 );

    //create outline
    outlinePass = new OutlinePass( new THREE.Vector2( window.innerWidth, window.innerHeight ), scene, camera );
    outlinePass.visibleEdgeColor.set = '#FFFFFF'
    outlinePass.hiddenEdgeColor.set = '190a05'
    outlinePass.edgeStrength = Number( 7 );
    outlinePass.edgeThickness = Number( 2 );
    outlinePass.pulsePeriod = Number( 2 );
    outlinePass.edgeGlow = Number( 1 );
    composer.addPass( outlinePass );

    effectFXAA = new ShaderPass( FXAAShader );
    effectFXAA.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );
    composer.addPass( effectFXAA );

    // check what device we're using and adjust our camera field of view and input controls accordingly.

    if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
        console.log("mobile device");
        camera.fov = 130;
        camera.updateProjectionMatrix();
        document.addEventListener( 'touchmove', onDocumentTouchMove );
    }else{
        console.log("not a mobile device");
        renderer.domElement.style.touchAction = 'none';
        document.addEventListener( 'mousemove', onDocumentMouseMove );
    }
}


function onDocumentMouseMove( event ) {

    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}


function onDocumentTouchMove( event ) {

    mouse.x = ( event.touches[0].clientX / window.innerWidth ) * 2 - 1;
    //mouse.y = ( event.touches[0].clientY / window.innerHeight ); 
    //^ I want to set this up to be -1 in the middle of the phone screen and 1 at the bottom of the phone screen but i'm too shit at math.
}


function onDoorClick( event ) {

    console.log('door clicked');

    // gsap.to(camera.position, {
    //     x: selectedObject.position.x,
    //     y: selectedObject.position.y,
    //     z: selectedObject.position.z,
    //     duration: 3,
    //     onComplete: function (){
    //         // match new scene position with selected door position
    //         roomGroup.position.x = selectedObject.position.x
    //         roomGroup.position.z = selectedObject.position.z

    //         // small brain visible boolean and scene add / removal.
    //         roomGroup.visible = true;
    //         scene.add( roomGroup );

    //         fieldGroup.visible = false;
    //         scene.remove( fieldGroup );
    //     }
    // });
}


function animate() {

    requestAnimationFrame( animate );

    //mesh.rotation.x += 0;
    //mesh.rotation.y += 0;

    const delta = clock.getDelta();

    castingRay();
    
    renderer.render( scene, camera );
    //controls.update( delta );

    composer.render();
}


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );

    composer.setSize( window.innerWidth, innerHeight );
    effectFXAA.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );
}