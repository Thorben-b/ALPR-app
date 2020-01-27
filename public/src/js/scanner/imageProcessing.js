function segmentCharacters(img) {

    // Apply the filters needed to find the contours
    rgb = applyRGBFilter(img);

    let thresh = new cv.Mat();
    cv.adaptiveThreshold(rgb, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 19, 9)

    let threshGauss = new cv.Mat();
    cv.adaptiveThreshold(rgb, threshGauss, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 51, 27)

    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(thresh, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);

    let bounding_boxes = [];
    if (contours.size() > 0) {
        for (let i = 0; i < contours.size(); i++) {
            let cnt = contours.get(i);
            let possibleChar = checkIfChar(cnt, rgb);
            if (possibleChar) {
                bounding_boxes.push(possibleChar);
            }
        }
    }

    bounding_boxes.sort(function(a, b) { return a.x - b.x }) //sort bounding_boxes by x values, so characters are read from left to right
    let characters = [];

    for (let i = 0; i < bounding_boxes.length; i++) {
        let bbox = bounding_boxes[i];
        let rect = new cv.Rect(bbox.x, bbox.y, bbox.width, bbox.height)
        let char_image = threshGauss.roi(rect);
        characters.push(char_image);
    }

    //Delete CV.mats
    thresh.delete();
    threshGauss.delete();
    contours.delete();
    hierarchy.delete();
    rgb.delete();

    return characters;
}

function checkIfChar(contour, image) {
    let boundingRect = cv.boundingRect(contour);
    let boundingRectWidth = boundingRect.width;
    let boundingRectHeight = boundingRect.height;

    const max_height = image.size().height * 0.85;
    const min_height = image.size().height * 0.60;
    const max_width = image.size().width * 0.12;
    const min_width = image.size().width * 0.03;

    if (boundingRectHeight <= max_height && boundingRectHeight >= min_height &&
        boundingRectWidth <= max_width && boundingRectWidth >= min_width) {

        // Give the rect some extra pixels, which'll be useful for OCR later
        boundingRect.x -= 2;
        boundingRect.y -= 2;
        boundingRect.height += 4;
        boundingRect.width += 4;

        return boundingRect;
    } else {
        return null;
    }
}

function applyRGBFilter(img) {

    let dst = new cv.Mat();
    cv.cvtColor(img, dst, cv.COLOR_BGR2HSV, 0);
    let rgbaPlanes = new cv.MatVector();
    cv.split(dst, rgbaPlanes);
    let value = rgbaPlanes.get(2);

    dst = resizeImage(value);

    let kernel = cv.Mat.ones(3, 3, cv.CV_8U);
    let topHat = new cv.Mat();
    cv.morphologyEx(dst, topHat, cv.MORPH_TOPHAT, kernel);
    let blackHat = new cv.Mat();
    cv.morphologyEx(dst, blackHat, cv.MORPH_BLACKHAT, kernel);

    let add = new cv.Mat();
    cv.add(dst, topHat, add);
    let subtract = new cv.Mat();
    cv.subtract(add, blackHat, subtract);

    let blur = new cv.Mat();
    cv.GaussianBlur(subtract, blur, new cv.Size(5, 5), 0);

    //deleting cv.Mats to clear memory
    dst.delete();
    rgbaPlanes.delete();
    topHat.delete();
    blackHat.delete();
    add.delete();
    subtract.delete();
    //

    return blur;
}

function resizeImage(img) {

    const scale_percentage = 150;
    let width = img.size().width * scale_percentage / 100;
    let height = img.size().height * scale_percentage / 100;
    let dsize = new cv.Size(width, height);
    cv.resize(img, img, dsize, 0, 0, cv.INTER_CUBIC);
    return img;
}