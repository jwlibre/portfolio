import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {gsap} from 'gsap';

const locations = {
    "overview": new THREE.Vector3(-5,0,0),
    "home": new THREE.Vector3(0.3,1,7),
    "videos": new THREE.Vector3(-1.4,2.2,3),
    "music": new THREE.Vector3(-7.5,-1.2,3),
    "portfolio": new THREE.Vector3(-5,0.25,5.5),
    "cv": new THREE.Vector3(-4.5,-5.25,0.5),
    "credits": new THREE.Vector3(-4.5,0,0.5),
}

const rotations = {
    "overview": new THREE.Vector3(0,0,0),
    "home": new THREE.Vector3(0,(Math.PI/4)+0.08,0),
    "videos": new THREE.Vector3(0,0,0),
    "music": new THREE.Vector3(0,-0.3,0),
    "portfolio": new THREE.Vector3(0,0,0),
    "cv": new THREE.Vector3(Math.PI/2,0,0),
    "credits": new THREE.Vector3(0,0,0),
}

const clickableObjects = [
    "VHS_SF_BlowingSmoke",
    "VHS_AB_Pricks",
    "VHS_SF_Live",
    "VHS_AB_RatVMole",
    "VHS_Saosin",
    "AB",
    "SF_1",
    "SF_2",
    "Portfolio1",
    "Portfolio2",
    "Portfolio3",
    "Portfolio4",
    "Portfolio5",
    "Portfolio6",
    "tv",
]

var targetMeshes = [];

var model
var mixer
var myCanvas = document.getElementById("canvas")
const clock = new THREE.Clock();
const mouse = new THREE.Vector2();
const scene = new THREE.Scene();
let selectedObjects = [];

// camera
var camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.01, 50 );
camera.rotation.order = 'YXZ';

// renderer
const renderer = new THREE.WebGLRenderer({canvas: myCanvas});
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.outputEncoding = THREE.sRGBEncoding;
document.body.appendChild( renderer.domElement );

const links = ["home", "videos", "music", "portfolio", "cv", "credits"];

// LOADING MANAGER
const manager = new THREE.LoadingManager( () => {
    const loadingScreen = document.getElementById( 'loading-screen' );
    loadingScreen.classList.add( 'fade-out' );
    // optional: remove loader from DOM via event listener
    loadingScreen.addEventListener( 'transitionend', onTransitionEnd );
});
manager.onProgress = function ( url, itemsLoaded, itemsTotal ) {
    var loadingPercentage = Math.round((itemsLoaded/itemsTotal)) * 100;
    // console.log(loadingPercentage)
    document.getElementById("loading-percentage").innerHTML = "loading " + loadingPercentage + "%";
    // console.log(loadingPercentageText);
    // loadingPercentageText.innerHTML = loadingPercentage;
       // console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
}
function onTransitionEnd( event ) {
    event.target.remove();
}

var loader = new GLTFLoader(manager);

var tvScreenDefaultMaterial

// raycaster
const raycaster = new THREE.Raycaster();
raycaster.layers.set( 3 );

// load the room model and put it in the first position
var room = loader.load('assets/home_office_90s_no_curtains.glb', function(room_gltf) {
    const room_model = room_gltf.scene;
    placeModel(room_model, "home", true);
    scene.add(room_model);
    for (let i=0; i<clickableObjects.length; i++) {
        if (clickableObjects[i] == "tv") {
            room_model.getObjectByName("tv").children[2].layers.enable(3);
            targetMeshes.push(room_model.getObjectByName(clickableObjects[i]))
        } else {
        if (room_model.getObjectByName(clickableObjects[i]).type == 'Mesh') {
            room_model.getObjectByName(clickableObjects[i]).layers.enable(3);
        } else {
            room_model.getObjectByName(clickableObjects[i]).children[0].layers.enable(3);
        }
        targetMeshes.push(room_model.getObjectByName(clickableObjects[i]))
    }
    };
    tvScreenDefaultMaterial = room_model.getObjectByName("TV_SCREEN").material
});

// load the curtains, place in first position, play their animations
var curtains = loader.load('assets/curtains_only.glb', function(curtains_gltf) {
    var curtains_model = curtains_gltf.scene;
    scene.add(curtains_model);
    console.log("curtains placed")
    placeModel(curtains_model, "home", true);

    curtains_model.animations = curtains_gltf.animations;

    let curtainMaterial = new THREE.MeshBasicMaterial(
        {side: THREE.DoubleSide, opacity: 0.5, transparent: true}
    );

    curtains_model.children[ 0 ].material = curtainMaterial;
    curtains_model.children[ 1 ].material = curtainMaterial;

    mixer = new THREE.AnimationMixer(curtains_model);
    mixer.clipAction(curtains_model.animations[ 0 ]).play();
    mixer.clipAction(curtains_model.animations[ 1 ]).play();

    animate();
    });

// background
scene.background = new THREE.Color( 0xaaccff );

function animate( ) {
	requestAnimationFrame( animate );
    castingRay();
    renderer.render(scene, camera);
    if ( mixer ) mixer.update( clock.getDelta() );
    roomSceneControls();
}

// Main navigation bar links
for (let i=0; i<links.length; i++){
    document.getElementById(links[i]).addEventListener("click", function() {
        placeModel(scene.children[0], links[i]);
        placeModel(scene.children[1], links[i]);
    });
};



// useful functions
function placeModel(model, key, init) {
    if (init) {
        model.position.y = locations[key].y
        model.position.x = locations[key].x
        model.position.z = locations[key].z
        model.rotation.x = rotations[key].x
        model.rotation.y = rotations[key].y
        model.rotation.z = rotations[key].z
    } else {
        gsap.to(model.position, {duration: 3, x: locations[key].x, y: locations[key].y, z: locations[key].z});
        gsap.to(model.rotation, {duration: 3, x: rotations[key].x, y: rotations[key].y, z: rotations[key].z});
        animate();
    }
}

var hoveredObjects = []

function castingRay() {

    raycaster.setFromCamera( mouse, camera );
    var isIntersected = raycaster.intersectObjects( targetMeshes );
    
    if (isIntersected.length > 0) {
        if (hoveredObjects.length > 0) {
            hoveredObjects[0].material.color.set('white')
            hoveredObjects = []
            }
        hoveredObjects.push(isIntersected[0].object)
        hoveredObjects[0].material.color.set('cyan')
    } else {
        if (hoveredObjects.length > 0) {
        hoveredObjects[0].material.color.set('white')
        hoveredObjects = []
        }
    }

    function onTargetMeshClick(  ) {
        
        var isIntersected = raycaster.intersectObjects( targetMeshes );
        if (isIntersected.length > 0) {
            if (isIntersected[0].object.name.includes('VHS')) {
                onVHSClick ( isIntersected[0].object.name )
            }
            if (isIntersected[0].object.name.includes('TV')) {
                onTVClick();
            }
        }
    }

    myCanvas.addEventListener('click', onTargetMeshClick, {once:true})

	renderer.render( scene, camera );
}


// event listeners

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );

    // composer.setSize( window.innerWidth, innerHeight );
    // effectFXAA.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );
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

function roomSceneControls(){
    camera.rotation.y += 0.03 * ( - ( mouse.x * .015 ) - camera.rotation.y );
    camera.rotation.x += 0.03 * ( (mouse.y * .015) - camera.rotation.x );
    // camera.rotation.z = 0;
}


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
window.addEventListener('resize', onWindowResize, false);



// video and audio
function onVHSClick ( name ) {
    // if any audio or video playing, turn them off
    // audioCDStop();
    audioVHSStop();
    videoStop();
    
    let video = document.getElementById(name);
    let audio = document.getElementById(name + "_audio");
    audio.play();
    video.play();
    video.setAttribute('crossorigin', 'anonymous');
    let videoTexture = new THREE.VideoTexture( video );
    videoTexture.format = THREE.RGBAFormat;
    videoTexture.flipY = false;
    let videoMaterial = new THREE.MeshBasicMaterial( {map: videoTexture, side: THREE.DoubleSide} );
    scene.getObjectByName("TV_SCREEN").material = videoMaterial;

    // animate();
}

function onTVClick (  ) {
    // simple function to stop TV video and audio if playing by clicking the TV
    audioVHSStop();
    videoStop();
}

function audioVHSStop () {
    var audioVHSObjects = document.getElementsByClassName("audio_vhs");
    for (let j=0; j<audioVHSObjects.length; j++){
        var audioVHSObject = audioVHSObjects[j];
        if (audioVHSObject.currentTime > 0){
            audioVHSObject.pause()
            audioVHSObject.currentTime = 0;
            console.log("stopped a vhs audio file")
        }
    }
}

// function audioCDStop () {
//     var audioCDObjects = document.getElementsByClassName("audio_cd");
//     for (let j=0; j<audioCDObjects.length; j++){
//         var audioCDObject = audioCDObjects[j];
//         if (audioCDObject.currentTime > 0){
//             audioCDObject.pause()
//             audioCDObject.currentTime = 0;
//         }
//     }
// }


function videoStop () {
    var videoObjects = document.getElementsByClassName("video");
    for (let j=0; j<videoObjects.length; j++){
        var videoObject = videoObjects[j];
        if (videoObject.currentTime > 0){
            videoObject.pause()
            videoObject.currentTime = 0;
            console.log("stopped a vhs video file")
        }
    }
    scene.getObjectByName("TV_SCREEN").material = tvScreenDefaultMaterial;
    
}


Object.defineProperty(HTMLMediaElement.prototype, 'playing', {
    get: function(){
        return !!(this.currentTime > 0 && !this.paused && !this.ended && this.readyState > 2);
    }
})