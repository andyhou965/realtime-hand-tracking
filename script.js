const drawCanvas = document.querySelector("#draw_canvas");
const drawCtx = drawCanvas.getContext("2d");

let w,
	h,
	balls = [];
let finger = {
	x: undefined,
	y: undefined,
};
let rgb = [
	"rgb(26, 188, 156)",
	"rgb(46, 204, 113)",
	"rgb(52, 152, 219)",
	"rgb(155, 89, 182)",
	"rgb(241, 196, 15)",
	"rgb(230, 126, 34)",
	"rgb(231, 76, 60)",
];

function init() {
	resizeReset();
	animationLoop();
}

function resizeReset() {
	w = drawCanvas.width = window.innerWidth;
	h = drawCanvas.height = window.innerHeight;
}

function animationLoop() {
	drawCtx.clearRect(0, 0, w, h);
	drawCtx.globalCompositeOperation = "lighter";
	drawBalls();

	let temp = [];
	for (let i = 0; i < balls.length; i++) {
		if (balls[i].time <= balls[i].ttl) {
			temp.push(balls[i]);
		}
	}
	balls = temp;

	requestAnimationFrame(animationLoop);
}

function drawBalls() {
	for (let i = 0; i < balls.length; i++) {
		balls[i].update();
		balls[i].draw();
	}
}

function getRandomInt(min, max) {
	return Math.round(Math.random() * (max - min)) + min;
}

function easeOutQuart(x) {
	return 1 - Math.pow(1 - x, 4);
}

class Ball {
	constructor() {
		this.start = {
			x: finger.x + getRandomInt(-20, 20),
			y: finger.y + getRandomInt(-20, 20),
			size: getRandomInt(30, 40),
		};
		this.end = {
			x: this.start.x + getRandomInt(-300, 300),
			y: this.start.y + getRandomInt(-300, 300),
		};

		this.x = this.start.x;
		this.y = this.start.y;
		this.size = this.start.size;

		this.style = rgb[getRandomInt(0, rgb.length - 1)];

		this.time = 0;
		this.ttl = 120;
	}
	draw() {
		drawCtx.fillStyle = this.style;
		drawCtx.beginPath();
		drawCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
		drawCtx.closePath();
		drawCtx.fill();
	}
	update() {
		if (this.time <= this.ttl) {
			let progress = 1 - (this.ttl - this.time) / this.ttl;

			this.size = this.start.size * (1 - easeOutQuart(progress));
			this.x = this.x + (this.end.x - this.x) * 0.01;
			this.y = this.y + (this.end.y - this.y) * 0.01;
		}
		this.time++;
	}
}

const videoElement = document.querySelector("#input_video");
const videoCanvas = document.querySelector("#video_canvas");
const videoCtx = videoCanvas.getContext("2d");

videoWidth = videoCanvas.width;
videoHeight = videoCanvas.height;

console.log(window.innerWidth, window.innerHeight);

function onResults(results) {
	videoCtx.save();
	videoCtx.clearRect(0, 0, videoWidth, videoHeight);
	videoCtx.drawImage(results.image, 0, 0, videoWidth, videoHeight);
	if (results.multiHandLandmarks) {
		for (const landmarks of results.multiHandLandmarks) {
			INDEX_FINGER_TIP = landmarks[8];
			finger.x = INDEX_FINGER_TIP.x * w;
			finger.y = INDEX_FINGER_TIP.y * h;

			for (let i = 0; i < 3; i++) {
				balls.push(new Ball());
			}

			// drawConnectors(videoCtx, landmarks, HAND_CONNECTIONS, {
			// 	color: "#00FF00",
			// 	lineWidth: 5,
			// });
			// drawLandmarks(videoCtx, landmarks, {
			// 	color: "#FF0000",
			// 	lineWidth: 2,
			// });
		}
	}
	finger.x = undefined;
	finger.y = undefined;
	videoCtx.restore();
}

const hands = new Hands({
	locateFile: (file) => {
		return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
	},
});
hands.setOptions({
	maxNumHands: 2,
	modelComplexity: 1,
	minDetectionConfidence: 0.5,
	minTrackingConfidence: 0.5,
	selfieMode: true,
});
hands.onResults(onResults);

const camera = new Camera(videoElement, {
	onFrame: async () => {
		await hands.send({ image: videoElement });
	},
	width: videoWidth,
	height: videoHeight,
});
camera.start();

window.addEventListener("DOMContentLoaded", init);
window.addEventListener("resize", resizeReset);
