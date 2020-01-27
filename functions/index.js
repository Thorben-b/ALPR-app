/* eslint-disable promise/always-return */
const functions = require('firebase-functions');
var admin = require('firebase-admin');
var cors = require('cors')({ origin: true });
var serviceAccount = require("./pwa-fbkey.json");

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://alpr-test.firebaseio.com/'
});

exports.storePlatesData = functions.https.onRequest((request, response) => {
    cors(request, response, () => {
        admin.database().ref('kentekens').push({
                date: request.body.date,
                image: request.body.image,
                plate: request.body.plate,
                time: request.body.time
            })
            .then(() => {
                response.status(201).json({ message: 'Data stored', plate: request.body.plate });
            })
            .catch((err) => {
                response.status(500).json({ error: err });
            });
    });
});