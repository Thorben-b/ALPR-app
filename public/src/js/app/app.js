//Check that service workers are supported by the browser
if ('serviceWorker' in navigator) {
    navigator.serviceWorker
        .register('sw.js')
        .then(function() {
            console.log('Service worker registered!');
        })
        .catch(function(err) {
            console.log(err);
        });
}

// var deferredPrompt;

// window.addEventListener('beforeinstallprompt', function(event) {
//     console.log('beforeinstallprompt fired');
//     event.preventDefault();
//     deferredPrompt = event;
//     return false;
// });