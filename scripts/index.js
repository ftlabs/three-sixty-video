'use strict';


const THREE = require('three');
require('webvr-polyfill');

WebVRConfig = {

  // Forces availability of VR mode, even for non-mobile devices.
  FORCE_ENABLE_VR: true, // Default: false.

  BUFFER_SCALE: 0.5,
};


// from THREE.js
function fovToNDCScaleOffset( fov ) {

	const pxscale = 2.0 / ( fov.leftTan + fov.rightTan );
	const pxoffset = ( fov.leftTan - fov.rightTan ) * pxscale * 0.5;
	const pyscale = 2.0 / ( fov.upTan + fov.downTan );
	const pyoffset = ( fov.upTan - fov.downTan ) * pyscale * 0.5;
	return { scale: [ pxscale, pyscale ], offset: [ pxoffset, pyoffset ] };

}

// from THREE.js
function fovPortToProjection( fov, rightHanded, zNear, zFar ) {

	rightHanded = rightHanded === undefined ? true : rightHanded;
	zNear = zNear === undefined ? 0.01 : zNear;
	zFar = zFar === undefined ? 10000.0 : zFar;

	const handednessScale = rightHanded ? - 1.0 : 1.0;

	// start with an identity matrix
	const mobj = new THREE.Matrix4();
	const m = mobj.elements;

	// and with scale/offset info for normalized device coords
	const scaleAndOffset = fovToNDCScaleOffset( fov );

	// X result, map clip edges to [-w,+w]
	m[ 0 * 4 + 0 ] = scaleAndOffset.scale[ 0 ];
	m[ 0 * 4 + 1 ] = 0.0;
	m[ 0 * 4 + 2 ] = scaleAndOffset.offset[ 0 ] * handednessScale;
	m[ 0 * 4 + 3 ] = 0.0;

	// Y result, map clip edges to [-w,+w]
	// Y offset is negated because this proj matrix transforms from world coords with Y=up,
	// but the NDC scaling has Y=down (thanks D3D?)
	m[ 1 * 4 + 0 ] = 0.0;
	m[ 1 * 4 + 1 ] = scaleAndOffset.scale[ 1 ];
	m[ 1 * 4 + 2 ] = - scaleAndOffset.offset[ 1 ] * handednessScale;
	m[ 1 * 4 + 3 ] = 0.0;

	// Z result (up to the app)
	m[ 2 * 4 + 0 ] = 0.0;
	m[ 2 * 4 + 1 ] = 0.0;
	m[ 2 * 4 + 2 ] = zFar / ( zNear - zFar ) * - handednessScale;
	m[ 2 * 4 + 3 ] = ( zFar * zNear ) / ( zNear - zFar );

	// W result (= Z in)
	m[ 3 * 4 + 0 ] = 0.0;
	m[ 3 * 4 + 1 ] = 0.0;
	m[ 3 * 4 + 2 ] = handednessScale;
	m[ 3 * 4 + 3 ] = 0.0;

	mobj.transpose();

	return mobj;

}

// from THREE.js
function fovToProjection( fov, rightHanded, zNear, zFar ) {

	const DEG2RAD = Math.PI / 180.0;

	const fovPort = {
		upTan: Math.tan( fov.upDegrees * DEG2RAD ),
		downTan: Math.tan( fov.downDegrees * DEG2RAD ),
		leftTan: Math.tan( fov.leftDegrees * DEG2RAD ),
		rightTan: Math.tan( fov.rightDegrees * DEG2RAD )
	};

	return fovPortToProjection( fovPort, rightHanded, zNear, zFar );

}

class ThreeSixtyVideo {
	constructor (videoContainer) {

		let preserveDrawingBuffer = false;

		if (navigator.getVRDisplays) {
			navigator.getVRDisplays()
			.then(displays => {
				if (displays.length > 0) {
					this.vrDisplay = displays[0];
					this.addButton('Reset Pose', 'R', null, function () { this.vrDisplay.resetPose(); });
					if (this.vrDisplay.capabilities.canPresent) this.vrPresentButton = this.addButton('Enter VR', 'E', 'media/icons/cardboard64.png', this.onVRRequestPresent);
					window.addEventListener('vrdisplaypresentchange', () => this.onVRPresentChange(), false);
				}
			});
			preserveDrawingBuffer = false;
		} else if (navigator.getVRDevices) {
			console.error('Your browser supports WebVR but not the latest version. See <a href=\'http://webvr.info\'>webvr.info</a> for more info.');
		} else {
			console.error('Your browser does not support WebVR. See <a href=\'http://webvr.info\'>webvr.info</a> for assistance.');
		}

		this.camera;
		this.scene;
		this.renderer;
		this.videoContainer = videoContainer;
		this.vrDisplay = null;
		this.vrPresentButton;
		const video = videoContainer.getElementsByTagName('video')[0];
		const rect = video.getBoundingClientRect();
		video.style.display = 'none';
		this.video = video;

		this.camera = new THREE.PerspectiveCamera( 90, rect.width / rect.height, 1, 100 );
		this.camera.up.set( 0, 0, 1 );
		this.scene = new THREE.Scene();

		const renderer = new THREE.WebGLRenderer( { antialias: false, preserveDrawingBuffer } );
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( rect.width, rect.height );
		renderer.autoClear = false;
		videoContainer.appendChild( renderer.domElement );
		this.renderer = renderer;

		const texture = new THREE.VideoTexture( video );
		texture.minFilter = THREE.LinearFilter;
		texture.magFilter = THREE.LinearFilter;
		texture.format = THREE.RGBFormat;

		const material = new THREE.MeshBasicMaterial({ color: 0xffffff, map: texture });
		const geometry = new THREE.SphereGeometry( 5, 16, 8 );

		const mS = (new THREE.Matrix4()).identity();
		mS.elements[0] = -1;
		geometry.applyMatrix(mS);

		const sphere = new THREE.Mesh( geometry, material );
		this.scene.add( sphere );

	}

	resize() {

		if (this.vrDisplay && this.vrDisplay.isPresenting) {

			this.camera.aspect = window.innerWidth / window.innerHeight;

			const leftEye = this.vrDisplay.getEyeParameters('left');
			const rightEye = this.vrDisplay.getEyeParameters('right');

			this.renderer.setSize(
				Math.max(leftEye.renderWidth, rightEye.renderWidth) * 2,
				Math.max(leftEye.renderHeight, rightEye.renderHeight)
			);
		} else {
			this.renderer.setSize( this.video.width, this.video.height );
		}
	}

	stopAnimation() {
		cancelAnimationFrame(this.raf);
	}

	startAnimation() {
		this.raf = requestAnimationFrame( () => this.startAnimation() );
		this.render();
	}

	renderSceneView (pose, eye) {
		let orientation = pose.orientation;
		let position = pose.position;
		if (!orientation) {
			orientation = [0, 0, 0, 1];
		}
		if (!position) {
			position = [0, 0, 0];
		}
		this.camera.position.fromArray(position);
		this.camera.rotation.setFromQuaternion(new THREE.Quaternion(...orientation), 'XZY');
		if (eye) {
			this.camera.projectionMatrix = fovToProjection(eye.fieldOfView, true, this.camera.near, this.camera.far );
			this.camera.position.add(new THREE.Vector3(...eye.offset));
		} else {
			this.camera.fov = 45;
			this.camera.updateProjectionMatrix();
		}

		this.renderer.render(this.scene, this.camera);
	}

	render() {
		if (this.vrDisplay) {
			const pose = this.vrDisplay.getPose();
			if (this.vrDisplay.isPresenting) {
				const size = this.renderer.getSize();

				this.renderer.setScissorTest( true );
				this.renderer.clear();

				this.renderer.setScissor( 0, 0, size.width / 2, size.height );
				this.renderer.setViewport( 0, 0, size.width / 2, size.height );
				this.renderSceneView(pose, this.vrDisplay.getEyeParameters('left'));

				this.renderer.setScissor( size.width / 2, 0, size.width / 2, size.height );
				this.renderer.setViewport( size.width / 2, 0, size.width / 2, size.height );
				this.renderSceneView(pose, this.vrDisplay.getEyeParameters('right'));

				this.renderer.setScissorTest( false );
				this.renderer.setViewport( 0, 0, size.width, size.height );
				this.vrDisplay.submitFrame(pose);
			} else {
				this.renderSceneView(pose, null);
			}
		} else {

			// No VRDisplay found.
			this.renderer.render(this.scene, this.camera);
		}
	}

	onVRRequestPresent () {
		this.vrDisplay.requestPresent([{ source: this.renderer.domElement }])
		.then(() => {}, function () {
			console.error('requestPresent failed.', 2000);
		});
	}

	onVRExitPresent () {
		this.vrDisplay.exitPresent()
		.then(() => {}, function () {
			console.error('exitPresent failed.', 2000);
		});
	}

	onVRPresentChange () {
		this.resize();
		if (this.vrDisplay.isPresenting) {
			if (this.vrDisplay.capabilities.hasExternalDisplay) {
				this.removeButton(this.vrPresentButton);
				this.vrPresentButton = this.addButton('Exit VR', 'E', 'media/icons/cardboard64.png', this.onVRExitPresent);
			}
		} else {
			if (this.vrDisplay.capabilities.hasExternalDisplay) {
				this.removeButton(this.vrPresentButton);
				this.vrPresentButton = this.addButton('Enter VR', 'E', 'media/icons/cardboard64.png', this.onVRRequestPresent);
			}
		}
	}


	addButton(text, shortcut, icon, callback) {
		const button = document.createElement('button');
		button.textContent = text;
		button.addEventListener('click', callback.bind(this));
		this.videoContainer.appendChild(button);
		return button;
	}

	removeButton() {

	}
}

(function () {
	const video = document.getElementsByTagName('video')[0];
	video.loop = true;
	video.muted = true;
	video.play();
}());

const videoContainer = document.querySelectorAll('*[data-three-sixy-video]');
[].slice.call(videoContainer)
.map(el => new ThreeSixtyVideo(el))
.forEach(tsv => tsv.startAnimation());
