const videoElement = document.querySelector("#input_video");
const videoCanvas = document.querySelector("#video_canvas");
const videoCtx = videoCanvas.getContext("2d");

function onResults(results) {
	videoCtx.save();
	videoCtx.clearRect(0, 0, videoCanvas.width, videoCanvas.height);
	videoCtx.drawImage(
		results.image,
		0,
		0,
		videoCanvas.width,
		videoCanvas.height
	);
	if (results.multiHandLandmarks) {
		for (const landmarks of results.multiHandLandmarks) {
			drawConnectors(videoCtx, landmarks, HAND_CONNECTIONS, {
				color: "#00FF00",
				lineWidth: 5,
			});
			drawLandmarks(videoCtx, landmarks, {
				color: "#FF0000",
				lineWidth: 2,
			});
		}
	}
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
	width: 1920,
	height: 1080,
});
camera.start();

const drawCanvas = document.querySelector("#draw_canvas");
const drawCtx = drawCanvas.getContext("2d");

let w,
	h,
	balls = [];
let mouse = {
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

function mousemove(e) {
	mouse.x = e.x;
	mouse.y = e.y;

	for (let i = 0; i < 3; i++) {
		balls.push(new Ball());
	}
}

function mouseout() {
	mouse.x = undefined;
	mouse.y = undefined;
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
			x: mouse.x + getRandomInt(-20, 20),
			y: mouse.y + getRandomInt(-20, 20),
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

window.addEventListener("DOMContentLoaded", init);
window.addEventListener("resize", resizeReset);
window.addEventListener("mousemove", mousemove);
window.addEventListener("mouseout", mouseout);
