const MODEL_URL = 'src/ML/model.json';
const CLASSES = [{
    id: 1,
    display_name: "kenteken",
}];

async function loadModel() {

    if (tf == null) {
        throw new Error('Cannot load Tensorflow.js');
    }

    return await tf.loadGraphModel(MODEL_URL);
}

// Adapted from startScope / endScope in https://github.com/tensorflow/tfjs/blob/f6a7635d22eb867abce6b6e78256517ff1f25e7e/tfjs-core/src/engine.ts#L850
function startPreditionScope() {
    const scopeInfo = {
        track: [],
        name: 'unnamed scope',
        id: window.tf.engine().state.nextScopeId++
    };
    if (name) {
        scopeInfo.name = name;
    }
    window.tf.engine().state.scopeStack.push(scopeInfo);
    window.tf.engine().state.activeScope = scopeInfo;
}
function endPreditionScope() {
    let state = window.tf.engine().state;
    // Dispose the arrays tracked in this scope.
    for (let i = 0; i < state.activeScope.track.length; i++) {
        state.activeScope.track[i].dispose();
    }
    state.activeScope = state.scopeStack.length === 0 ?
        null :
        state.scopeStack[state.scopeStack.length - 1];
}

async function getPredictions(image) {

    // console.log('voor: ', tf.memory().numTensors)
    const output_names = ['detection_classes', 'num_detections', 'detection_boxes', 'detection_scores'];
    const batched = tf.tidy(() => {

        //Create a tf.tensor from an image with shape [width, height, channels]
        image = tf.browser.fromPixels(image);

        //Reshape to single-element batch so we can pass it to executeAsync.
        //Shape becomes [1, width, height, channels]
        return image.expandDims(0);
    });
    console.log('numTensors (before executeAsync): ' + tf.memory().numTensors);
    startPreditionScope();
    const predictions = await model.executeAsync(batched, output_names).catch((error => {
        return error;
    }));
    batched.dispose();
    tf.disposeVariables();

    if (predictions != null && predictions.length) {
        const classes = predictions[0].dataSync();
        const count = predictions[1].dataSync()[0];
        const boxes = predictions[2].dataSync();
        const scores = predictions[3].dataSync();

        for (let i = 0; i < predictions.length; i++) {
            tf.dispose(predictions[i]);
        }

        // console.log('na: ', tf.memory().numTensors);
        endPreditionScope();
        return {
            classes: classes,
            count: count,
            boxes: boxes,
            scores: scores,
        };

    }
    endPreditionScope();
    return null;
}

async function getClasses() {
    return this.CLASSES;
}
