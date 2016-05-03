'use strict';


const THREE = require('three');

let container;
let camera;
let scene;
let renderer;
let video = document.querySelector('video');
let texture;
let material;
let mesh;
let composer;
let mouseX = 0;
let mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;
let cube_count;
let meshes = [];
let materials = [];
let xgrid = 20;
let ygrid = 10;
let counter = 1;

video.style.display = 'none';

init();
animate();

function init() {
	container = document.createElement( 'div' );
	document.body.appendChild( container );
	camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 10000 );
	camera.position.z = 500;
	scene = new THREE.Scene();
	let light = new THREE.DirectionalLight( 0xffffff );
	light.position.set( 0.5, 1, 1 ).normalize();
	scene.add( light );
	renderer = new THREE.WebGLRenderer( { antialias: false } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	container.appendChild( renderer.domElement );
	texture = new THREE.VideoTexture( video );
	texture.minFilter = THREE.LinearFilter;
	texture.magFilter = THREE.LinearFilter;
	texture.format = THREE.RGBFormat;

	let i;
	let j;
	let ux;
	let uy;
	let ox;
	let oy;
	let geometry;
	let xsize;
	let ysize;

	ux = 1 / xgrid;
	uy = 1 / ygrid;
	xsize = 480 / xgrid;
	ysize = 204 / ygrid;
	let parameters = { color: 0xffffff, map: texture };
	cube_count = 0;
	for ( i = 0; i < xgrid; i ++ )
	for ( j = 0; j < ygrid; j ++ ) {
		ox = i;
		oy = j;
		geometry = new THREE.BoxGeometry( xsize, ysize, xsize );

		change_uvs( geometry, ux, uy, ox, oy );
		materials[ cube_count ] = new THREE.MeshLambertMaterial( parameters );
		material = materials[ cube_count ];
		material.hue = i/xgrid;
		material.saturation = 1 - j/ygrid;
		material.color.setHSL( material.hue, material.saturation, 0.5 );
		mesh = new THREE.Mesh( geometry, material );
		mesh.position.x = ( i - xgrid/2 ) * xsize;
		mesh.position.y = ( j - ygrid/2 ) * ysize;
		mesh.position.z = 0;
		mesh.scale.x = mesh.scale.y = mesh.scale.z = 1;
		scene.add( mesh );
		mesh.dx = 0.001 * ( 0.5 - Math.random() );
		mesh.dy = 0.001 * ( 0.5 - Math.random() );
		meshes[ cube_count ] = mesh;
		cube_count += 1;
	}
	renderer.autoClear = false;
	document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	window.addEventListener( 'resize', onWindowResize, false );
}

function onWindowResize() {
	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}

function change_uvs( geometry, unitx, unity, offsetx, offsety ) {
	let faceVertexUvs = geometry.faceVertexUvs[ 0 ];
	for ( let i = 0; i < faceVertexUvs.length; i ++ ) {
		let uvs = faceVertexUvs[ i ];
		for ( let j = 0; j < uvs.length; j ++ ) {
			let uv = uvs[ j ];
			uv.x = ( uv.x + offsetx ) * unitx;
			uv.y = ( uv.y + offsety ) * unity;
		}
	}
}

function onDocumentMouseMove(event) {
	mouseX = ( event.clientX - windowHalfX );
	mouseY = ( event.clientY - windowHalfY ) * 0.3;
}

function animate() {
	requestAnimationFrame( animate );
	render();
}
function render() {
	let time = Date.now() * 0.00005;
	camera.position.x += ( mouseX - camera.position.x ) * 0.05;
	camera.position.y += ( - mouseY - camera.position.y ) * 0.05;
	camera.lookAt( scene.position );
	for ( let i = 0; i < cube_count; i ++ ) {
		const material = materials[ i ];
		const h = ( 360 * ( material.hue + time ) % 360 ) / 360;
		material.color.setHSL( h, material.saturation, 0.5 );
	}
	if ( counter % 1000 > 200 ) {
		for ( let i = 0; i < cube_count; i ++ ) {
			const mesh = meshes[ i ];
			mesh.rotation.x += 10 * mesh.dx;
			mesh.rotation.y += 10 * mesh.dy;
			mesh.position.x += 200 * mesh.dx;
			mesh.position.y += 200 * mesh.dy;
			mesh.position.z += 400 * mesh.dx;
		}
	}
	if ( counter % 1000 === 0 ) {
		for ( let i = 0; i < cube_count; i ++ ) {
			const mesh = meshes[ i ];
			mesh.dx *= -1;
			mesh.dy *= -1;
		}
	}
	counter++;
	renderer.clear();
	renderer.render(scene, camera);
}