function updateUI(data) {

    for (var i = 0; i < data.length; i++) {
        let plateArray = [data[i].plate, data[i].date, data[i].time];
        fillTable(plateArray);
    }
}

function readAllPlatesFromFirebase() {

    let url = 'https://alpr-test.firebaseio.com/kentekens.json';
    let networkDataReceived = false;

    fetch(url)
        .then((res => {
            return res.json();
        }))
        .then((data => {
            networkDataReceived = true;
            var dataArray = [];
            for (var key in data) { //object.key
                dataArray.push(data[key]);
            }
            updateUI(dataArray);
        }))
        .catch((err => {
            console.log('[DatabaseHelper] ', err);
        }));
}

function checkIDB(status) {
    if ('indexedDB' in window) {
        console.log('ja idb aanwezig');
        if (!status) {
            readAllDataFromIDB('plates').then((data => {
                console.log('from indexedDB');
                updateUI(data);
            }))
        }
    } else {
        console.log('geen idb');
    }
}

function sendDataToFirebase(data) {
    fetch('https://us-central1-alpr-test.cloudfunctions.net/storePlatesData', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            date: new Date().toISOString(),
            image: '',
            plate: data.plate,
            time: '00:00'
        })
    }).then((res => {
        console.log('Sent data to firebase, ', res);
        readAllPlatesFromFirebase();
    }));
}

// const dbRef = firebase.database().ref();
// const plateRef = dbRef.child('kentekens');

// function writePlateToDB(plate, time, date) {
//     console.log(plate, date, time);
//     let plateObject = {
//         plate: plate,
//         date: date,
//         time: time
//     };

//     plateRef.push(plateObject, function() {
//         console.log("data has been inserted");
//     });
// }


// function updateUI(data) {

//     for (var i = 0; i < data.length; i++) {
//         let plateArray = [data[i].plate, data[i].date, data[i].time];
//         fillTable(plateArray);
//     }
// }

// function readAllPlatesFromDB() {

//     let url = 'https://alpr-test.firebaseio.com/kentekens.json';
//     let networkDataReceived = false;

//     fetch(url).then((res => {
//             return res.json();
//         }))
//         .then((data => {
//             networkDataReceived = true;

//             var dataArray = [];
//             for (var key in data) { //object.key
//                 dataArray.push(data[key]);
//             }
//             updateUI(dataArray);
//         }));
// }