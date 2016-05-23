'use strict';

const ThreeSixtyVideo = require('./three-sixty-video');

if (navigator.userAgent.match(/samsung.* mobile vr/ig)) {
	console.log('360 Video handled natively');
} else {
	const videos = document.querySelectorAll('*[data-three-sixty-video]');
	[].slice.call(videos)
	.map(el => new ThreeSixtyVideo(el));
}
