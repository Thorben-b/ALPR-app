var tbody = document.getElementById('tbody_id');
var form = document.querySelector('form');
var plateLabel = document.querySelector('#plateTextLabel');

function fillTable(data) {

    var row = tbody.insertRow();
    var tdCheckbox = document.createElement('td');
    row.appendChild(tdCheckbox);

    for (var key of data) {
        var td = document.createElement('td');
        var text = document.createTextNode(key);
        td.appendChild(text);
        row.appendChild(td);
    }
}

//Deprecated
function generateTableHead(data) {
    var thead = table.createTHead();
    var row = thead.insertRow();

    for (var key of data) {
        var th = document.createElement('th');
        var text = document.createTextNode(key);
        th.appendChild(text);
        row.appendChild(th);
    }
}

function sendData(plate) {
    var date = new Date();
    fetch('https://us-central1-alpr-test.cloudfunctions.net/storePlatesData', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                //id: date.toISOString(),
                date: date.toISOString().substr(0, 10),
                image: '',
                plate: trimPlate(plate).toUpperCase(),
                time: date.getHours() + ':' + date.getMinutes()
            })
        })
        .then(function(res) {
            console.log('data sent ', res);
            updateUI();
        })
        .catch((err) => {
            alert('Er is geen verbinding!');
        });
}

form.addEventListener('submit', function(event) {

    event.preventDefault();

    var plateField = document.querySelector('#plateText');
    var plate = plateField.value;

    if (plate.trim() === '' || !isCorrectLength(plate)) {
        alert('Voer (geldig) kenteken in!');
        return;
    }

    closeCameraArea();

    if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready
            .then(function(sw) {
                var date = new Date();
                var newPlate = {
                    // id: date.toISOString(),
                    date: date.toISOString().substr(0, 10),
                    image: '',
                    plate: trimPlate(plate).toUpperCase(),
                    time: date.getHours() + ':' + date.getMinutes()
                };
                writeDataToIDB('sync-plates', newPlate)
                    .then(function() {
                        sw.sync.register('sync-new-plates');
                    })
                    .then(function() {
                        alert('Opgeslagen voor syncing');
                    })
                    .catch((err) => {
                        console.log(err);
                    });
            });
    } else {
        sendData(plate);
    }
});

//Remove anything that's not a number or a letter from the plate
//and make it uppercase
function trimPlate(plate) {
    return plate.replace(/[^a-zA-Z0-9 ]/g, "");
}

function isCorrectLength(plate) {
    console.log(plate.length)
    if (plate.length === 6) {
        return true;
    } else {
        return false;
    }
}