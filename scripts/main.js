'use strict';

const ThreeSixtyVideo = require('./three-sixty-video');

(function () {
	const video = document.getElementsByTagName('video')[0];
	video.loop = true;
}());

const videoContainer = document.querySelectorAll('*[data-three-sixty-video]');
[].slice.call(videoContainer)
.map(el => new ThreeSixtyVideo(el));
