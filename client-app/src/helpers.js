export function getRandomLocation(latitude, longitude, radiusInMeters) {

    let getRandomCoordinates = function (radius, uniform) {
        // Generate two random numbers
        let a = Math.random(),
            b = Math.random();

        // Flip for more uniformity.
        if (uniform) {
            if (b < a) {
                let c = b;
                b = a;
                a = c;
            }
        }

        // It's all triangles.
        return [
            b * radius * Math.cos(2 * Math.PI * a / b),
            b * radius * Math.sin(2 * Math.PI * a / b)
        ];
    };

    let randomCoordinates = getRandomCoordinates(radiusInMeters, true);

    // Earths radius in meters via WGS 84 model.
    let earth = 6378137;

    // Offsets in meters.
    let northOffset = randomCoordinates[0],
        eastOffset = randomCoordinates[1];

    // Offset coordinates in radians.
    let offsetLatitude = northOffset / earth,
        offsetLongitude = eastOffset / (earth * Math.cos(Math.PI * (latitude / 180)));

    // Offset position in decimal degrees.
    return {
        latitude: latitude + (offsetLatitude * (180 / Math.PI)),
        longitude: longitude + (offsetLongitude * (180 / Math.PI))
    }
}

// https://www.geodatasource.com/developers/javascript
export function distance(lat1, lon1, lat2, lon2, unit) {
    if ((lat1 === lat2) && (lon1 === lon2)) {
        return 0;
    } else {
        let radlat1 = Math.PI * lat1 / 180;
        let radlat2 = Math.PI * lat2 / 180;
        let theta = lon1 - lon2;
        let radtheta = Math.PI * theta / 180;
        let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        if (dist > 1) {
            dist = 1;
        }
        dist = Math.acos(dist);
        dist = dist * 180 / Math.PI;
        dist = dist * 60 * 1.1515;
        if (unit === "K") {
            dist = dist * 1.609344
        }
        if (unit === "N") {
            dist = dist * 0.8684
        }
        return dist;
    }
}