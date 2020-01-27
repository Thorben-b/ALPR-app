importScripts('src/js/database/idb.js');
importScripts('src/js/database/indexedDB.js');

var CACHE_STATIC = "static-v4";
var CACHE_DYNAMIC = "dynamic-v2";
var STATIC_FILES = [
    '/',
    'index.html',
    'offline.html',
    'src/css/app.css',
    'src/css/camera.css',
    'src/js/app/app.js',
    'src/js/app/camera.js',
    'src/js/database/idb.js',
    'src/js/material.min.js',
    'manifest.json',
    'https://fonts.googleapis.com/css?family=Roboto:400,700',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-blue.min.css'
];

//See if cache is getting full
function trimCache(cacheName, maxItems) {
    caches.open(cacheName)
        .then(function(cache) {
            return cache.keys()
                .then(function(keys) {
                    if (keys.length > maxItems) {
                        cache.delete(keys[0])
                            .then(trimCache(cacheName, maxItems)); //Recursive method untill keys.length < maxItems
                    }
                })
        });
}

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_STATIC)
        .then(function(cache) {
            console.log('[Service Worker] Precaching App Shell');
            cache.addAll(STATIC_FILES);
        })
    )
});

//See if there's an old cache and remove it
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys()
        .then(function(keyList) {
            return Promise.all(keyList.map(function(key) { //Promise.all takes array of promises and waits on all of them to finish
                if (key !== CACHE_STATIC && key !== CACHE_DYNAMIC) { //keyList.map takes array of strings and makes it an array of Promises
                    console.log('[Service Worker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', function(event) {

    var url = 'https://alpr-test.firebaseio.com/kentekens';
    if (event.request.url.indexOf(url) > -1) {
        event.respondWith(fetch(event.request)
            .then((response => {
                var clonedRes = response.clone();
                clearAllDataFromIDB('plates')
                    .then(function() {
                        return clonedRes.json();
                    })
                    .then((data => {
                        for (var key in data) {
                            writeDataToIDB('plates', data[key]);
                        }
                    }));
                return response;
            }))
            .catch((err) => {
                console.log('[Service Worker] Geen internet ', event.request);
            })
        );
    } else if (isInStaticCache(event.request.url, STATIC_FILES)) {
        event.respondWith(
            caches.match(event.request)
        );
    } else {
        event.respondWith(
            caches.match(event.request)
            .then(function(response) {
                if (response) {
                    return response;
                } else {
                    return fetch(event.request)
                        .then(function(res) {
                            return caches.open(CACHE_DYNAMIC)
                                .then(function(cache) {
                                    cache.put(event.request.url, res.clone());
                                    return res;
                                })
                        })
                        .catch(function(err) {
                            return caches.open(CACHE_STATIC)
                                .then(function(cache) {
                                    if (event.request.headers.get('accept').includes('text/html')) {
                                        return cache.match('/offline.html');
                                    }
                                });
                        });
                }
            })
        );
    }
});


function isInStaticCache(string, array) {
    var cachePath;
    if (string.indexOf(self.origin) === 0) { // request targets domain where we serve the page from (i.e. NOT a CDN)
        //console.log('matched ', string);
        cachePath = string.substring(self.origin.length); // take the part of the URL AFTER the domain (e.g. after localhost:8080)
    } else {
        cachePath = string; // store the full request (for CDNs)
    }
    return array.indexOf(cachePath) > -1;
}

self.addEventListener('sync', function(event) {
    console.log('[Service Worker] Background Syncing', event);
    if (event.tag === 'sync-new-plates') {
        console.log('[Service Worker] Syncing new plates');
        event.waitUntil(
            readAllDataFromIDB('sync-plates')
            .then((data) => {
                for (var dt of data) {
                    fetch('https://us-central1-alpr-test.cloudfunctions.net/storePlatesData', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            },
                            body: JSON.stringify({
                                //id: dt.id,
                                date: dt.date,
                                image: dt.image,
                                plate: dt.plate,
                                time: dt.time
                            })
                        })
                        .then(function(res) {
                            console.log('[Service Worker] Sync data sent ', res);
                            if (res.ok) {
                                res.json().then((resData) => {
                                    deleteItemFromIDB('sync-plates', resData.plate);
                                });
                            }
                        })
                        .catch((err) => {
                            console.log('[Service Worker] Sync plates error while sending', err);
                        });
                }
            })
        );
    }
});