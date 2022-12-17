<script>
import $ from 'jquery'
import { setBlockTracking } from 'vue';

export default {
    data() {
        return {
            view: 'map',
            codes: [],
            neighborhoods: [],
            incidents: [],
            leaflet: {
                map: null,
                center: {
                    lat: 44.955139,
                    lng: -93.102222,
                    address: ""
                },
                zoom: 12,
                bounds: {
                    nw: { lat: 45.008206, lng: -93.217977 },
                    se: { lat: 44.883658, lng: -92.993787 }
                },
                neighborhood_markers: [
                    { location: [44.942068, -93.020521], marker: null },
                    { location: [44.977413, -93.025156], marker: null },
                    { location: [44.931244, -93.079578], marker: null },
                    { location: [44.956192, -93.060189], marker: null },
                    { location: [44.978883, -93.068163], marker: null },
                    { location: [44.975766, -93.113887], marker: null },
                    { location: [44.959639, -93.121271], marker: null },
                    { location: [44.947700, -93.128505], marker: null },
                    { location: [44.930276, -93.119911], marker: null },
                    { location: [44.982752, -93.147910], marker: null },
                    { location: [44.963631, -93.167548], marker: null },
                    { location: [44.973971, -93.197965], marker: null },
                    { location: [44.949043, -93.178261], marker: null },
                    { location: [44.934848, -93.176736], marker: null },
                    { location: [44.913106, -93.170779], marker: null },
                    { location: [44.937705, -93.136997], marker: null },
                    { location: [44.949203, -93.093739], marker: null }
                ]
            }
        };
    },
    methods: {
        viewMap(event) {
            this.view = 'map';
        },

        viewNewIncident(event) {
            this.view = 'new_incident';
        },

        viewAbout(event) {
            this.view = 'about';
        },

        getJSON(url) {
            return new Promise((resolve, reject) => {
                $.ajax({
                    dataType: 'json',
                    url: url,
                    success: (response) => {
                        resolve(response);
                    },
                    error: (status, message) => {
                        reject({ status: status.status, message: status.statusText });
                    }
                });
            });
        },

        uploadJSON(method, url, data) {
            return new Promise((resolve, reject) => {
                $.ajax({
                    type: method,
                    url: url,
                    contentType: 'application/json; charset=utf-8',
                    data: JSON.stringify(data),
                    dataType: 'text',
                    success: (response) => {
                        resolve(response);
                    },
                    error: (status, message) => {
                        reject({ status: status.status, message: status.statusText });
                    }
                });
            });
        },
        search() {
            let search = document.getElementById('search').value.replace(' ', '+');
            if (search == '') {
                alert('You have to actually search for something!');
                return;
            }
            let url = 'https://nominatim.openstreetmap.org/search?q=' + search + '&format=jsonv2&limit=0';
            this.getJSON(url).then((result) => {
                if (result.length == 0) {
                    alert("No matches found! Please try a different search query.");
                    document.getElementById('search').value = '';
                    return;
                } else {
                    let coords = [result[0].lon, result[0].lat];
                    let lon = result[0].lon;
                    let lat = result[0].lat;
                    if (lat < 44.883658 || lon < -93.217977 || lat > 45.008206 || lon > -92.993787) {
                        alert("No matches found within St. Paul! Please try a different search query.");
                        document.getElementById('search').value = '';
                        return;
                    } else {
                        this.leaflet.map.setView([lat, lon], 15);
                    }
                }
            }).catch((err) => {
                console.log(err);
            });
        },
        updateIncidents(url) {
            this.getJSON(url).then((result) => {
                this.incidents = result;
            }).catch((err) => {
                console.log(err);
            });
        }
    },
    mounted() {
        this.leaflet.map = L.map('leafletmap').setView([this.leaflet.center.lat, this.leaflet.center.lng], this.leaflet.zoom);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            minZoom: 11,
            maxZoom: 18
        }).addTo(this.leaflet.map);
        this.leaflet.map.setMaxBounds([[44.883658, -93.217977], [45.008206, -92.993787]]);

        let district_boundary = new L.geoJson();
        district_boundary.addTo(this.leaflet.map);

        this.getJSON('/data/StPaulDistrictCouncil.geojson').then((result) => {
            // St. Paul GeoJSON
            $(result.features).each((key, value) => {
                district_boundary.addData(value);
            });
        }).catch((error) => {
            console.log('Error:', error);
        });

        this.getJSON('http://localhost:8000/neighborhoods/').then((result) => {
            for (let i = 0; i < result.length; i++) {
                this.neighborhoods[i] = result[i].name;
            }
        }).catch((err) => {
            console.log(err);
        });

        this.getJSON('http://localhost:8000/incidents/').then((result) => {
            this.incidents = result;
            for (let i = 0; i < this.leaflet.neighborhood_markers.length; i++) {
                let count = 0;
                for (let j = 0; j < this.incidents.length; j++) {
                    if (this.incidents[j].neighborhood_number == i + 1) {
                        count += 1;
                    }
                }
                let marker = L.marker(this.leaflet.neighborhood_markers[i].location);
                marker.addTo(this.leaflet.map);
                marker.bindPopup(count + ' crimes');
            }
        }).catch((err) => {
            console.log(err);
        });

        this.leaflet.map.on('moveend', (e) => {
            let currentNeighborhoods = [];
            let bounds = this.leaflet.map.getBounds();
            let neighborhoods_temp = this.leaflet.neighborhood_markers;
            for (let i = 0; i < neighborhoods_temp.length; i++) {
                let temp = neighborhoods_temp[i].location;
                if (bounds.contains(temp)) {
                    currentNeighborhoods.push(i + 1);
                }
            }
            let url = 'http://localhost:8000/incidents/?neighborhood=' + currentNeighborhoods.toString();
            this.updateIncidents(url);
        });
    }
}
</script>

<template>
    <div class="grid-container">
        <div class="grid-x grid-padding-x">
            <p :class="'cell small-4 ' + ((view === 'map') ? 'selected' : 'unselected')" @click="viewMap">Map</p>
            <p :class="'cell small-4 ' + ((view === 'new_incident') ? 'selected' : 'unselected')"
                @click="viewNewIncident">New Incident</p>
            <p :class="'cell small-4 ' + ((view === 'about') ? 'selected' : 'unselected')" @click="viewAbout">About</p>
        </div>
    </div>
    <div v-show="view === 'map'">
        <div class="grid-container">
            <div class="grid-x grid-padding-x">
                <input type="text" id="search" class="cell small-10" placeholder="Search">
                <button type="button" class="cell small-2 button" @click="search()">Go</button>
            </div>
            <div class="grid-x grid-padding-x">
                <div id="leafletmap" class="cell auto"></div>
            </div>
            <div class="grid-x grid-padding-x">
                <div id="crimetable" class="cell auto">
                    <table>
                        <thead>
                            <tr>
                                <th>Case Number</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Incident</th>
                                <th>Police grid</th>
                                <th>Neighborhood</th>
                                <th>Block</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(item) in incidents">
                                <td>{{ item.case_number }}</td>
                                <td>{{ item.date }}</td>
                                <td>{{ item.time }}</td>
                                <td>{{ item.incident }}</td>
                                <td>{{ item.police_grid }}</td>
                                <td>{{ neighborhoods[item.neighborhood_number - 1] }}</td>
                                <td>{{ item.block }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    <div v-if="view === 'new_incident'">
        <!-- Replace this with your actual form: can be done here or by making a new component -->
        <div class="grid-container">
            <div class="grid-x grid-padding-x">
                <h1 class="cell auto">New Incident Form</h1>
            </div>
        </div>
    </div>
    <div v-if="view === 'about'">
        <!-- Replace this with your actual about the project content: can be done here or by making a new component -->
        <div class="grid-container">
            <div class="grid-x grid-margin-x">
                <h1 class="cell auto" style="text-align: center;">About the Project</h1>
            </div>
            <div class="grid-x grid-margin-x"
                style="border: 0.05em solid black; border-radius: 1em; margin-top: 1em; margin-bottom: 1em">
                <h3 class="cell small-12" style="text-align: center">Team members</h3>
                <div class="cell small-6"
                    style="border: 0.05em solid black; border-radius: 1em; margin-top: 1em; margin-bottom: 1em">
                    <h4 style="text-align: center">Owen Hiskey</h4>
                    <img src="data/owen.jpg" alt="Owen photo"
                        style="width:15rem; margin-left: auto; margin-right: auto; display: block;">
                    <p style="font-size: 1.25rem; text-align: center">Owen Hiskey is a senior computer science student
                        graduating this May.</p>
                </div>
                <div class="cell small-6"
                    style="border: 0.05em solid black; border-radius: 1em; margin-top: 1em; margin-bottom: 1em">
                    <h4 style="text-align: center">Neshua Aguilar</h4>
                    <!-- Add an image here -->
                    <!-- Add a short bio here -->
                </div>
            </div>
            <div class="grid-x grid-margin-x">
                <div class="cell small-12" style="border: 0.05em solid black; border-radius: 1em; margin-top: 1em">
                    <h3 class="cell auto" style="text-align: center">Tools and technologies used</h3>
                    <div class="cell small-12">
                        <ul style="font-size: 1.25rem">
                            <li>RESTful API from Project 3</li>
                            <li>Leaflet API</li>
                            <li>Nominatim API</li>
                            <li>Vue.JS</li>
                            <li>Foundation Framework</li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="grid-x grid-margin-x">
                <div class="cell small-12" style="border: 0.05em solid black; border-radius: 1em; margin-top: 1em">
                    <h3 class="cell auto" style="text-align: center">Interesting findings</h3>
                    <div class="cell small-12">
                        <ul style="font-size: 1.25rem">
                            <li>Few crimes occur in the Saint Anthony Park area</li>
                            <li>Many crimes occur in the Payne/Phalen area</li>
                            <li>3 thefts occured at 5:00:00PM on 2014-08-14 in the Payne/Phalen neighborhood</li>
                            <li>The most common crime type appears to be Theft</li>
                            <li>Nominatim's API is full-featured and useful</li>
                            <li>The 'map.moveend' event is triggered both after panning and zooming the map</li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="grid-x grid-margin-x">
                <div class="cell small-12" style="border: 0.05em solid black; border-radius: 1em; margin-top: 1em">
                    <h3 class="cell auto" style="text-align: center">Project demo</h3>
                    <div class="cell small-12">
                        <p>Add a demo here later</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style>
#leafletmap {
    height: 500px;
}

.selected {
    background-color: rgb(10, 100, 126);
    color: white;
    border: solid 1px white;
    text-align: center;
    cursor: pointer;
}

.unselected {
    background-color: rgb(200, 200, 200);
    color: black;
    border: solid 1px white;
    text-align: center;
    cursor: pointer;
}
</style>
