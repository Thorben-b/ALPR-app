var dbPromise = idb.open('plate-store', 1, function(db) {
    if (!db.objectStoreNames.contains('plates')) {
        db.createObjectStore('plates', { keyPath: 'plate' });
    }
    if (!db.objectStoreNames.contains('sync-plates')) {
        db.createObjectStore('sync-plates', { keyPath: 'plate' });
    }
});

function writeDataToIDB(st, data) {
    return dbPromise.then((db => {
        var tx = db.transaction(st, 'readwrite');
        var store = tx.objectStore(st);
        store.put(data);
        return tx.complete;
    }));
}

function readAllDataFromIDB(st) {
    return dbPromise.then((db => {
        var tx = db.transaction(st, 'readonly');
        var store = tx.objectStore(st);
        return store.getAll();
    }));
}

function clearAllDataFromIDB(st) {
    return dbPromise.then(function(db) {
        var tx = db.transaction(st, 'readwrite');
        var store = tx.objectStore(st);
        store.clear();
        return tx.complete;
    });
}

function deleteItemFromIDB(st, plate) {
    dbPromise.then((db) => {
            var tx = db.transaction(st, 'readwrite');
            var store = tx.objectStore(st);
            store.delete(plate);
            return tx.complete;
        })
        .then(() => {
            console.log('item deleted from IDB!')
        })
}