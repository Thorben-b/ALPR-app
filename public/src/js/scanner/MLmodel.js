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

async function getPredictions(image) {
    const output_names = ['detection_classes', 'num_detections', 'detection_boxes', 'detection_scores'];
    const batched = tf.tidy(() => {

        //Create a tf.tensor from an image with shape [width, height, channels]
        image = tf.browser.fromPixels(image);

        //Reshape to single-element batch so we can pass it to executeAsync.
        //Shape becomes [1, width, height, channels]
        return image.expandDims(0);
    });
    console.log('numTensors (before executeAsync): ' + tf.memory().numTensors);
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

        return {
            classes: classes,
            count: count,
            boxes: boxes,
            scores: scores,
        };

    }
    return null;
}

async function getClasses() {
    return this.CLASSES;
}
