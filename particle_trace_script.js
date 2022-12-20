const particleArray = [];
let hue = 0;
let w = window.innerWidth;
let h = window.innerHeight;
const position = {
	x: undefined,
	y: undefined,
};

//** Hand tracking using Mediapipe HandLandmarks*/
const videoElement = document.querySelector("#input_video");
const videoCanvas = document.querySelector("#video_canvas");
const videoCtx = videoCanvas.getContext("2d");

videoWidth = videoCanvas.width;
videoHeight = videoCanvas.height;

function onResults(results) {
	videoCtx.save();
	videoCtx.clearRect(0, 0, videoWidth, videoHeight);
	videoCtx.drawImage(results.image, 0, 0, videoWidth, videoHeight);
	if (results.multiHandLandmarks) {
		for (const landmarks of results.multiHandLandmarks) {
			INDEX_FINGER_TIP = landmarks[8];
			position.x = INDEX_FINGER_TIP.x * w;
			position.y = INDEX_FINGER_TIP.y * h;

			for (let i = 0; i < 5; i++) {
				particleArray.push(new Particle());
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
	position.x = undefined;
	position.y = undefined;
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
	minDetectionConfidence: 0.7,
	minTrackingConfidence: 0.7,
	selfieMode: false,
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

//** Draw the finger trace */
const canvas = document.querySelector("#draw_canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

class Particle {
	constructor() {
		this.x = position.x;
		this.y = position.y;
		this.size = Math.random() * 15 + 1;
		this.speedX = Math.random() * 3 - 1.5;
		this.speedY = Math.random() * 3 - 1.5;
		this.color = "hsl(" + hue + ",100%, 50%)";
	}
	update() {
		this.x += this.speedX;
		this.y += this.speedY;
		if (this.size > 0.2) this.size -= 0.1;
	}
	draw() {
		ctx.fillStyle = this.color;
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
		ctx.fill();
	}
}

function handleParticles() {
	for (let i = 0; i < particleArray.length; i++) {
		particleArray[i].update();
		particleArray[i].draw();
		for (let j = i; j < particleArray.length; j++) {
			const dx = particleArray[i].x - particleArray[j].x;
			const dy = particleArray[i].y - particleArray[j].y;
			const distance = Math.sqrt(dx * dx + dy * dy);
			if (distance < 100) {
				ctx.beginPath();
				ctx.strokeStyle = particleArray[i].color;
				ctx.lineWidth = 0.2;
				ctx.moveTo(particleArray[i].x, particleArray[i].y);
				ctx.lineTo(particleArray[j].x, particleArray[j].y);
				ctx.stroke();
				ctx.closePath();
			}
		}
		if (particleArray[i].size <= 0.3) {
			particleArray.splice(i, 1);
			i--;
		}
	}
}

function animate() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "rgba(0,0,0,0.1)";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	handleParticles();
	hue += 3;
	requestAnimationFrame(animate);
}

animate();

window.addEventListener("resize", function () {
	w = canvas.width = window.innerWidth;
	h = canvas.height = window.innerHeight;
});
