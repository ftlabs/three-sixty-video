'use strict';


const THREE = require('three');
require('webvr-polyfill');

let container;
let camera;
let scene;
let renderer;
let video = document.querySelector('video');
let texture;

video.style.display = 'none';
video.loop = true;
video.muted = true;
video.play();

init();

function init() {

	window.addEventListener( 'resize', onWindowResize, false );

	container = document.createElement( 'div' );
	document.body.appendChild( container );
	camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 1, 100 );
	scene = new THREE.Scene();

	let light = new THREE.DirectionalLight( 0xffffff );
	light.position.set( 0.5, 1, 1 ).normalize();
	scene.add( light );

	renderer = new THREE.WebGLRenderer( { antialias: false } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.autoClear = false;
	container.appendChild( renderer.domElement );

	texture = new THREE.VideoTexture( video );
	texture.minFilter = THREE.LinearFilter;
	texture.magFilter = THREE.LinearFilter;
	texture.format = THREE.RGBFormat;

	const material = new THREE.MeshBasicMaterial({ color: 0xffffff, map: texture });
	const geometry = new THREE.SphereGeometry( 5, 16, 8 );

	const mS = (new THREE.Matrix4()).identity();
	mS.elements[0] = -1;
	geometry.applyMatrix(mS);

	const sphere = new THREE.Mesh( geometry, material );
	scene.add( sphere );
	animate();
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
	requestAnimationFrame( animate );
	render();
}

function render() {
	renderer.render(scene, camera);
}