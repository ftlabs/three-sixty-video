'use strict';

const ThreeSixtyVideo = require('./three-sixty-video');

(function () {
	const video = document.getElementsByTagName('video')[0];
	video.loop = true;
}());

if (navigator.userAgent.match(/samsung.* mobile vr/ig)) {
	console.log('360 Video handled natively');
} else {
	const videoContainer = document.querySelectorAll('*[data-three-sixty-video]');
	[].slice.call(videoContainer)
	.map(el => new ThreeSixtyVideo(el));
}
