
var myAPIKey = "d8fb8bce343b4c79885c5144f43928c9";
// On initialise la latitude et la longitude de Paris (centre de la carte)
var lat = 48.852969;
var lon = 2.349903;
var macarte = null;
var marker;

var violetIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
}) ; 


//On récupère la localisation de l'utilisateur si possible
function getLocation()
{
    if (navigator.geolocation)
    {
        navigator.geolocation.getCurrentPosition(setPosition);
    }
}

//On actualise la localisation récupérée
function setPosition(position)
{
    lat = position.coords.latitude;
    lon = position.coords.longitude;
    macarte.setView([lat, lon], 15);
    if(marker)
    {
        marker.remove();
    }
    reverse_geocoding(lat,lon);
}

function reverse_geocoding(lat,lon)
{
    const reverseGeocodingUrl = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${myAPIKey}`;
    // call Reverse Geocoding API - https://www.geoapify.com/reverse-geocoding-api/
    fetch(reverseGeocodingUrl).then(result => result.json()).then(featureCollection => {
        if (featureCollection.features.length === 0) {
            console.log("The address is not found");
            return;
        }  
        const foundAddress = featureCollection.features[0];
        var h_num = foundAddress.properties.housenumber;
        var street = foundAddress.properties.street;
        var post_code = foundAddress.properties.postcode;
        var city = foundAddress.properties.city;
        var country = foundAddress.properties.country;

        console.log(foundAddress);
        marker = L.marker(new L.LatLng(foundAddress.properties.lat, foundAddress.properties.lon)).addTo(macarte);
        // Remplir les champs de formulaire cachés avec les valeurs
        document.getElementById("addr").value = foundAddress.properties.formatted;
        console.log(document.getElementById("addr"));
        document.getElementById("lat").value = foundAddress.properties.lat;
        document.getElementById("lon").value = foundAddress.properties.lon;
        marker.bindPopup(
            `<div> ${h_num} ${street}</div> <p> ${post_code} ${city},${country}<p/>
                <button onclick="redirectToInterface();"> Déclarer </button>
            `).openPopup();
    });
}

// Fonction pour rediriger vers "interface.html"
function redirectToInterface() {
    document.getElementById("variableForm").submit();
}

// Fonction d'initialisation de la carte
function initMap() {
    var mapOptions = {
        center: [lat, lon],
        zoom: 7,
        zoomControl: false
    }
    // Créer l'objet "macarte" et l'insèrer dans l'élément HTML qui a l'ID "map"
    macarte = L.map('map',mapOptions);
    // Leaflet ne récupère pas les cartes (tiles) sur un serveur par défaut. Nous devons lui préciser où nous souhaitons les récupérer. Ici, openstreetmap.fr
    L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
        // Il est toujours bien de laisser le lien vers la source des données
        attribution: 'données © <a href="//osm.org/copyright">OpenStreetMap</a>/ODbL - rendu <a href="//openstreetmap.fr">OSM France</a>',
        minZoom: 1,
        maxZoom: 20
    }).addTo(macarte);

    // Add Geoapify Address Search control
    const addressSearchControl = L.control.addressSearch(myAPIKey, {
        position: 'topleft',
        resultCallback: (selectedAddress) => {
            lon = selectedAddress.lon;
            lat = selectedAddress.lat;
            if(marker)
            {
                marker.remove();
            }
            if (selectedAddress.bbox && selectedAddress.bbox.lat1 !== selectedAddress.bbox.lat2 && selectedAddress.bbox.lon1 !== selectedAddress.bbox.lon2) {
            macarte.fitBounds([[selectedAddress.bbox.lat1, selectedAddress.bbox.lon1], [selectedAddress.bbox.lat2, selectedAddress.bbox.lon2]], { padding: [100, 100] })
            } else {
            macarte.setView([selectedAddress.lat, selectedAddress.lon], 15);
            }
            //marker.bindPopup("<div>Your custom html</div> <br> <img src='towa.png' width='100' height='100' />");
            reverse_geocoding(lat,lon);
            },
            suggestionsCallback: (suggestions) => {
            console.log(suggestions);
        }
    });
    macarte.addControl(addressSearchControl);

    L.control.zoom({
        position: 'topleft',
    }).addTo(macarte);

    macarte.clicked = 0;

    macarte.on('click', function(e)
    {
        macarte.clicked = macarte.clicked + 1;
        setTimeout(function(){
            if(macarte.clicked == 1){ 
                lat_c = e.latlng.lat;
                lng_c = e.latlng.lng;
                console.log(lat_c,lng_c);
                if(marker){
                    marker.remove();
                }
                reverse_geocoding(lat_c,lng_c);  
                macarte.clicked = 0;
            }
        }, 300);
    });

    macarte.on('dblclick', function(e){
        macarte.clicked = 0;
        macarte.zoomIn();
    });
};

window.onload = function(){
    // Fonction d'initialisation qui s'exécute lorsque le DOM est chargé
    initMap(); 
    getLocation();
};   
        

// On viens chercher les données via le JSON et on les affiches. 
let xmlhttp = new XMLHttpRequest() ; 

xmlhttp.onreadystatechange = () => {
    if(xmlhttp.readyState == 4) {
        if(xmlhttp.status == 200){
            let donnees = JSON.parse(xmlhttp.responseText) ; 
            console.log(donnees) ; 
            var markers = L.markerClusterGroup();
            // Boucle sur les données : 
            Object.entries(donnees.pts).forEach(points => {
                // Un point
                let markerPts = L.marker([points[1].lat, points[1].lon], { icon : violetIcon} );
                // Faire une variable qu'on va envoyer, et append 
                var stringss = "<u>Adresse :</u> " + points[1].adress + "<br> <u> Date :</u> " + points[1].date + "<br> <u> Description :</u> " + points[1].description + "<br> <u> Images :</u> <img src=\"./images/"+ points[1].link_pict_1 + "\" height='60px' width='60px'>" ; 
                
                if (points[1].link_pict_2 !== null) {
                    stringss += "<img src=\"./images/"+ points[1].link_pict_2 + "\" height='60px' width='60px'>" ;
                }
                if (points[1].link_pict_3 !== null) {
                    stringss += "<img src=\"./images/"+ points[1].link_pict_3 + "\" height='60px' width='60px'>" ; 
                }
                var popup = L.popup().setContent(stringss) ; 
                markerPts.bindPopup(popup) ; 
                markers.addLayer(markerPts);
                }) ; 
                macarte.addLayer(markers);
                }
        else{
            console.log(xmlhttp.statusText) ; 
        }
    }
}

xmlhttp.open("GET", "./points.php") ; 

xmlhttp.send(null) ; 
