var response = document.querySelector('#response');

function openALPRresults(file) {
    var secret_key = "sk_a18ca011050cf8859a7f2bc7";
    var url = "https://api.openalpr.com/v2/recognize_bytes?" +
        "secret_key=" + secret_key +
        "&recognize_vehicle=0" +
        "&country=eu" +
        "&state=nl" +
        "&topn=5" +
        "&return_image=0";

    requestAPI(url, file)
        .then(function(post) {
            var jsonResponse = post.response;
            var result = jsonResponse.results[0];
            var plate = result.plate;
            var confidence = result.confidence;
            var img = jsonResponse.image_bytes;
            var creditsRemaining = jsonResponse.credits_monthly_total - jsonResponse.credits_monthly_used;

            document.getElementById("response").innerHTML =
                "Plate: " + plate + "<br>" +
                "Confidence: " + confidence + "<br>" +
                "Credits over " + creditsRemaining;
        })
        .catch(function(err) {
            document.getElementById("response").innerHTML = "Geen tenteken gevonden";
        });
}

function requestAPI(url, file) {
    //Create XHRRequest
    var request = new XMLHttpRequest();
    request.responseType = 'json';

    //return it as a Promise
    return new Promise(function(resolve, reject) {

        //setup our listeners to process completed requests
        request.onreadystatechange = function() {

            //only run if the request is complete
            if (request.readyState !== 4) {
                return;
            }

            // process response
            if (request.status >= 200 && request.status < 300) {
                resolve(request);
            } else {
                // If failed
                reject({
                    status: request.status,
                    statusText: request.statusText
                });
            }
        }
        request.open('POST', url);
        request.send(file);
    });
}