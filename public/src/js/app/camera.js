var openCameraButton = document.querySelector('#to-camera-mode');
var closeCameraButton = document.querySelector('#close-camera-mode');
var videoPlayer = document.querySelector('#player');
var canvas = document.querySelector('#canvas');
var canvasBB = document.querySelector('#canvasBBox');
var captureButton = document.querySelector('#capture-btn');
var response = document.querySelector('#response');
var resultText = document.getElementById('plateFound');
let model;
let modelPromise;
let ocrPromise;
let scheduler;
let stoppedCamera = false;

window.onload = async function() {
    readAllPlatesFromFirebase();
    modelPromise = await loadModel();
    ocrPromise = await loadOCR();
}

async function setupCamera() {

    if (!('mediaDevices' in navigator)) {
        navigator.mediaDevices = {};
    }

    if (!('getUserMedia' in navigator.mediaDevices)) {
        navigator.mediaDevices.getUserMedia = function(constraints) {
            var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

            if (!getUserMedia) {
                alert('getUserMedia is not supported in your browser')
                return Promise.reject(new Error('getUserMedia is not implemented!'));
            }

            return new Promise(function(resolve, reject) {
                getUserMedia.call(navigator, constraints, resolve, reject);
            });
        }
    }

    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false })
        .then(function(stream) {

            // Older browsers may not have srcObject, so check if it's present
            if ("srcObject" in videoPlayer) {
                mediaStream = stream;
                videoPlayer.style.display = 'block';
                videoPlayer.srcObject = stream;

                // Older browser support
            } else {
                videoPlayer.src = window.URL.createObjectURL(stream);
            }

        })
        .catch(function(err) {
            alert('De browser is niet compitabel met deze app');
        });
}

videoPlayer.addEventListener('loadedmetadata', function play() {

    canvas.width = videoPlayer.videoWidth;
    canvas.height = videoPlayer.videoHeight;
    canvasBB.width = canvas.width;
    canvasBB.height = canvas.height;
    runPredictions();
})

async function runPredictions() {

    model = await modelPromise;
    var context = canvasBB.getContext('2d');

    tf.engine().startScope();
    var pred = await getPredictions(videoPlayer);
    tf.engine().endScope();

    if (pred) {
        if (pred.count > 0) {
            resultText.innerText = 'Kentekens gevonden';
            renderPredictions(pred, context);
        }
    } else {
        context.clearRect(0, 0, canvasBB.width, canvasBB.height);
        resultText.innerText = 'Geen kentekens gevonden';
    }

    if (!stoppedCamera) {
        requestAnimationFrame(runPredictions);
    }
}

function renderPredictions(prediction, context) {

    context.clearRect(0, 0, canvasBB.width, canvasBB.height);

    const classes = prediction.classes;
    const count = prediction.count;
    const boxes = prediction.boxes;
    const scores = prediction.scores;

    //font options
    const font = "25px Arial";
    context.font = font;
    context.fillStyle = "red";

    for (let i = 0; i < count; i++) {
        const min_y = boxes[i * 4] * canvas.height;
        const min_x = boxes[i * 4 + 1] * canvas.width;
        const max_y = boxes[i * 4 + 2] * canvas.height;
        const max_x = boxes[i * 4 + 3] * canvas.width;

        context.beginPath();
        context.rect(min_x, min_y, max_x - min_x, max_y - min_y);
        context.lineWidth = 4;
        context.strokeStyle = 'red';
        context.stroke();

        context.fillText(
            scores[i].toFixed(3) * 100 + '% ' + CLASSES.find(label => label.id === classes[i]).display_name,
            min_x, min_y - 5);
    }
}

function openCameraArea() {
    stoppedCamera = false;
    var createCameraArea = document.querySelector('#create-picture');
    createCameraArea.style.transform = 'translateY(0vh)';
    var canvasDiv = document.querySelector('#canvasDiv');
    canvasDiv.style.display = 'block';
    setupCamera();
}

function stopCamera() {
    stoppedCamera = true;
    if (videoPlayer.srcObject) {
        videoPlayer.srcObject.getVideoTracks().forEach(function(track) {
            track.stop();
        });
    }
}

function closeCameraArea() {
    var createCameraArea = document.querySelector('#create-picture');
    createCameraArea.style.transform = 'translateY(100vh)';
    var canvasDiv = document.querySelector('#canvasDiv');
    canvasDiv.style.display = 'none';
    captureButton.style.display = 'inline';
    stopCamera();
}

async function takeSnapshot() {
    captureButton.style.display = 'none';
    var kentekenTextfield = document.querySelector('#plateText');

    canvas.width = videoPlayer.videoWidth;
    canvas.height = videoPlayer.videoHeight;

    // Use canvas to draw a frame when the capture button is pressed
    var context = canvas.getContext('2d');
    context.drawImage(videoPlayer, 0, 0);
    stopCamera();

    var predictions = await getPredictions(videoPlayer);
    if (predictions) {
        const boxes = predictions.boxes;
        const count = predictions.count;

        for (let i = 0; i < count; i++) {
            const min_y = boxes[i * 4] * canvas.height;
            const min_x = boxes[i * 4 + 1] * canvas.width;
            const max_y = boxes[i * 4 + 2] * canvas.height;
            const max_x = boxes[i * 4 + 3] * canvas.width;

            var imgData = context.getImageData(min_x, min_y, max_x - min_x, max_y - min_y);
            segment(imgData, max_x, max_y, min_x, min_y);
        }
    } else {
        kentekenTextfield.innerText = 'Geen kenteken gevonden';
    }
}

async function segment(imgData, max_x, max_y, min_x, min_y) {

    let kentekenCanvas = document.createElement('canvas');
    let kentekenContext = kentekenCanvas.getContext('2d');

    kentekenCanvas.width = max_x - min_x;
    kentekenCanvas.height = max_y - min_y;
    kentekenContext.putImageData(imgData, 0, 0)

    let src = cv.imread(kentekenCanvas);
    scheduler = await ocrPromise;
    let characters = segmentCharacters(src, scheduler);

    let width = 0;
    let height = 100;
    let newCanvas = document.createElement('canvas');
    let newCanvasContext = newCanvas.getContext('2d');
    newCanvas.height = height;

    if (characters) {
        characters.map((char) => {
            let charCanvas = document.createElement('canvas');
            cv.imshow(charCanvas, char);
            newCanvasContext.drawImage(charCanvas, width, 0)
            width += charCanvas.width;
        });

        let result = await performOCR(newCanvas, scheduler);
        setPlateText(result);

    } else {
        kentekenTextfield.value = 'Geen kenteken gevonden';
    }
}

function setPlateText(value) {
    var kentekenTextfield = document.querySelector('#plateText');
    var plateTextLabel = document.querySelector('#plateTextLabel');
    kentekenTextfield.value = value;
    plateTextLabel.innerText = value;
}

openCameraButton.addEventListener('click', openCameraArea);
closeCameraButton.addEventListener('click', closeCameraArea);
captureButton.addEventListener('click', takeSnapshot);