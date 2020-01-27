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

    // console.log('voor: ', tf.memory().numTensors)
    const output_names = ['detection_classes', 'num_detections', 'detection_boxes', 'detection_scores'];
    const batched = tf.tidy(() => {

        //Create a tf.tensor from an image with shape [width, height, channels]
        image = tf.browser.fromPixels(image);

        //Reshape to single-element batch so we can pass it to executeAsync.
        //Shape becomes [1, width, height, channels]
        return image.expandDims(0);
    });

    const predictions = await model.executeAsync(batched, output_names).catch((error => {
        return error;
    }));

    batched.dispose();

    if (predictions != null && predictions.length) {
        const classes = predictions[0].dataSync();
        const count = predictions[1].dataSync()[0];
        const boxes = predictions[2].dataSync();
        const scores = predictions[3].dataSync();

        for (let i = 0; i < predictions.length; i++) {
            tf.dispose(predictions[i]);
        }

        // console.log('na: ', tf.memory().numTensors);
        return {
            classes: classes,
            count: count,
            boxes: boxes,
            scores: scores,
        };

    }


    tf.dispose(predictions);
    // console.log('na: ', tf.memory().numTensors);
    return null;
}

async function getClasses() {
    return this.CLASSES;
}