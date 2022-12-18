<script>
import $ from 'jquery'
import { setBlockTracking } from 'vue';

export default {
    data() {
        return {
            view: 'map',
            codes: [],
            caseNum: [],
            neighborhoods: [],
            filteredNeighborhoods: [],
            incidents: [],
            incidentTypes: [],
            incidentCodeRanges: [
                { crime: 'Homicide', code: '100' },
                { crime: 'Murder', code: ['110', '120'] },
                { crime: 'Rape', code: ['210', '220'] },
                {
                    crime: 'Roberry', code: ['300', '310', '313', '314', '321', '322', '323', '324',
                        '331', '333', '334', '341', '342', '343', '344', '351', '352', '353', '354',
                        '361', '363', '364', '371', '372', '373', '374']
                },
                {
                    crime: 'Agravated Assault', code: ['400', '410', '411', '412', '420', '421', '422',
                        '430', '431', '432', '440', '441', '442', '450', '451', '452', '453']
                },
                {
                    crime: 'Burglary', code: ['500', '510', '511', '513', '515', '516', '520', '521',
                        '523', '525', '526', '530', '531', '533', '535', '536', '540', '541', '543',
                        '545', '545', '546', '550', '552', '551', '553', '555', '556', '560', '561', '563',
                        '565', '566']
                },
                {
                    crime: 'Theft', code: ['600', '603', '611', '612', '613', '614', '621', '622',
                        '623', '630', '631', '632', '633', '631', '633', '640', '641', '642', '643', '651',
                        '652', '653', '661', '662', '663', '671', '672', '673', '681', '682', '683', '691',
                        '692', '693']
                },
                {
                    crime: 'Motor Vehicle Theft', code: ['700', '710', '711', '712', '720', '721', '730', '731',
                        '732']
                },
                { crime: 'Assault', code: ['810', '861', '862', '863'] },
                {
                    crime: 'Arson', code: ['900', '901', '903', '905', '911', '913', '915', '921', '922', '923', '925',
                        '931', '933', '941', '942', '951', '961', '971', '972', '975', '981', '981', '982']
                },
                { crime: 'Criminal Damage to Property', code: ['1400', '1410', '1420', '1430'] },
                { crime: 'Graffiti', code: ['1401', '1415', '1416', '1425', '1426', '1435', '1436'] },
                {
                    crime: 'Narcotics', code: ['1800', '1810', '1811', '1812', '1813', '1814', '1815', '1820', '1822',
                        '1823', '1824', '1825', '1830', '1835', '1840', '1841', '1842', '1843', '1844', '1845', '1850',
                        '1855', '1860', '1885']
                },
                { crime: 'Weapons', code: '2619' },
                { crime: 'Death', code: '3100' },
                { crime: 'Proactive Police Visit', code: '9954' },
                { crime: 'Community Engagement Event', code: '9959' },
                { crime: 'Proactive Foot Patrol', code: '9986' }
            ],
            filteredIncidentTypes: [],
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

        containsNumbers(str) {
            return /\d/.test(str);
        },

        manipulateAdress(add) {
            let num = add.match(/\d+/)[0];
            let newNum = num + 0;
            let len = newNum.length;
            add = newNum.toString() + add.slice(len);
            return add;
        },

        addAdressMarker() {
            let caseNumber = document.getElementById('caseId').value
            let myAdd = '';
            if (!this.containsNumbers(caseNumber)) {
                alert('Enter a number')
            } else {
                if (caseNumber == '') {
                    alert('Enter a number')
                } else {
                    for (let i = 0; i < this.incidents.length; i++) {
                        if (this.incidents[i].case_number == caseNumber) {
                            myAdd = this.manipulateAdress(this.incidents[i].block)
                        }
                    }
                }
            };

            let myIcon = L.icon({
                iconUrl: 'data/map-marker-icon.png',
                iconSize: [38, 38],
                iconAnchor: [22, 22],
                popupAnchor: [-3, -3],
                shadowSize: [68, 95],
                shadowAnchor: [22, 94]
            });

            let lat;
            let lon;
            let url = 'https://nominatim.openstreetmap.org/search?q=' + myAdd + ',' + 'st_paul_minnesota' + '&format=jsonv2&limit=0';
            this.getJSON(url).then((result) => {
                console.log(result)
                lat = result[0].lat;
                lon = result[0].lon;
                if (lat < 44.883658 || lon < -93.217977 || lat > 45.008206 || lon > -92.993787) {
                    alert("No matches found within St. Paul! Please try a different search query.");
                    return;
                } else {
                    let info = [];
                    for (let i = 0; i < this.incidents.length; i++) {
                        if (this.incidents[i].case_number == caseNumber) {
                            info.push(this.incidents[i].date)
                            info.push(this.incidents[i].time)
                            info.push(this.incidents[i].incident)
                        }
                    }
                    L.marker([lat, lon], { icon: myIcon }).addTo(this.leaflet.map).bindPopup('Date: ' + info[0] + ', ' + 'Time: ' + info[1] + ', ' + 'Incident: ' + info[2])
                }

            }).catch((err) => {
                console.log(err);
            });


        },

        filterNeighborhoods() {
            let neighborhoodIndexes = []
            let i;
            let req;
            if (this.selectedNeighborhoods.length > 0) {
                for (i = 0; i < this.selectedNeighborhoods.length; i++) {
                    neighborhoodIndexes.push(this.neighborhoods.indexOf(this.selectedNeighborhoods[i]) + 1)
                }
                req = '?neighborhood=' + neighborhoodIndexes.toString();
            } else {
                req = '?'
            }

            return req;
        },

        filterLimit() {
            let maxIncidents = document.getElementById('maxIncident').value;
            let req;
            if (this.selectedNeighborhoods.length > 0) {
                if (maxIncidents == '') {
                    req = '&limit=1000';
                } else {
                    if (!this.containsNumbers(maxIncidents)) {
                        alert('Please enter a number for the incident limit')
                    } else {
                        req = '&limit=' + maxIncidents;
                    }
                }
            } else {
                if (maxIncidents == '') {
                    req = 'limit=1000';
                } else {
                    if (!this.containsNumbers(maxIncidents)) {
                        alert('Please enter a number for the incident limit')
                    } else {
                        req = 'limit=' + maxIncidents;

                    }
                }
            }

            return req;
        },

        filterDateRange() {
            let startDate = document.getElementById('startDate').value;
            let endDate = document.getElementById('endDate').value;
            let req;

            if (this.selectedNeighborhoods.length > 0) {
                if (startDate == '' & endDate == '') {
                    req = '&start_date=0000-00-00&end_date=9999-99-99';
                }
                if (startDate != '' & endDate != '') {
                    req = '&start_date=' + startDate + '&end_date=' + endDate;
                }
                if (startDate != '' & endDate == '') {
                    req = '&start_date=' + startDate;
                }
                if (startDate == '' & endDate != '') {
                    req = '&end_date=' + endDate;
                }
            } else {
                if (startDate == '' & endDate == '') {
                    req = '&start_date=0000-00-00&end_date=9999-99-99';
                }
                if (startDate != '' & endDate != '') {
                    req = 'start_date=' + startDate + '&end_date=' + endDate;
                }
                if (startDate != '' & endDate == '') {
                    req = '&start_date=' + startDate;
                }
                if (startDate == '' & endDate != '') {
                    req = '&end_date=' + endDate;
                }

            }
            return req;

        },

        getSelectedIncidentCodes() {
            let codes = [];
            for (let i = 0; i < this.incidentCodeRanges.length; i++) {
                if (this.filteredIncidentTypes.includes(this.incidentCodeRanges[i].crime)) {
                    if (Array.isArray(this.incidentCodeRanges[i].code)) {
                        for (let j = 0; j < this.incidentCodeRanges[i].code.length; j++) {
                            codes.push(this.incidentCodeRanges[i].code[j]);
                        }
                    } else {
                        codes.push(this.incidentCodeRanges[i].code);
                    }
                }
            }
            return codes;
        },

        filterIncidentType() {
            let req;
            if (this.selectedNeighborhoods.length > 0) {
                if (this.filteredIncidentTypes.length > 0) {
                    req = '&code=' + this.getSelectedIncidentCodes();
                } else {
                    req = " "
                }
            } else {
                if (this.filteredIncidentTypes == 0) {
                    req = " "
                } else {
                    req = '&code=' + this.getSelectedIncidentCodes();
                }
            }
            return req;

        },

        updateTable() {

            let url = 'http://localhost:8000/incidents/' + this.filterNeighborhoods() + this.filterLimit() + this.filterDateRange()
                + this.filterIncidentType();
            console.log(url)
            this.updateIncidents(url);

        },

        updateIncidents(url) {
            this.getJSON(url).then((result) => {
                this.incidents = result;
            }).catch((err) => {
                console.log(err);
            });
        },

        uploadIncident() {
            let caseNum = document.getElementById('casenumberinput').value;
            let date = document.getElementById('dateinput').value;
            let time = document.getElementById('timeinput').value;
            let code = document.getElementById('codeinput').value;
            let incident = document.getElementById('incidentinput').value;
            let police_grid = document.getElementById('gridinput').value;
            let neighborhood_number = document.getElementById('neighborhoodinput').value;
            let block = document.getElementById('blockinput').value;

            if (caseNum == '' || date == '' || time == '' || code == '' || incident == '' || police_grid == '' || neighborhood_number == '' || block == '') {
                alert('All fields must be filled out! Please try again.');
                return;
            }

        
            let json = new Object();
            json.case_number = caseNum;
            json.date = date;
            json.time = time;
            json.code = code;
            json.incident = incident;
            json.police_grid = police_grid;
            json.neighborhood_number = neighborhood_number;
            json.block = block;
            this.uploadJSON('PUT', 'http://localhost:8000/new-incident', json).then((result) => {
                alert('Incident successfully uploaded!');
                document.getElementById('casenumberinput').value = '';
                document.getElementById('dateinput').value = '';
                document.getElementById('timeinput').value = '';
                document.getElementById('codeinput').value = '';
                document.getElementById('incidentinput').value = '';
                document.getElementById('gridinput').value = '';
                document.getElementById('neighborhoodinput').value = '';
                document.getElementById('blockinput').value = '';
            }).catch((err) => {
                alert('Sorry, an incident with this case number already exists.');
            });
        }


    },

    computed: {
        selectedNeighborhoods: function () {
            return this.neighborhoods.filter(function (item) {
                return this.filteredNeighborhoods.includes(item);
            }, this);
        },
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

        this.getJSON('http://localhost:8000/codes/').then((result) => {
            for (let i = 0; i < result.length; i++) {
                this.incidentTypes.push(result[i]);
            }
        }).catch((err) => {
            console.log(err);
        })

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
            let url;
            let bounds = this.leaflet.map.getBounds();
            let neighborhoods_temp = this.leaflet.neighborhood_markers;
            for (let i = 0; i < neighborhoods_temp.length; i++) {
                let temp = neighborhoods_temp[i].location;
                if (bounds.contains(temp)) {
                    currentNeighborhoods.push(i + 1);
                }
            }
            if (document.getElementById('maxIncident').value != '') {
                url = 'http://localhost:8000/incidents/?neighborhood=' + currentNeighborhoods.toString() + '&limit=' + document.getElementById('maxIncident').value;
            } else {
                url = 'http://localhost:8000/incidents/?neighborhood=' + currentNeighborhoods.toString();
            }
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
        <div class="grid-container full">
            <div class="grid-x grid-padding-x">
                <input type="text" id="search" class="cell small-10" placeholder="Search">
                <button type="button" class="cell small-2 button" @click="search()">Go</button>
            </div>
            <div class="grid-x grid-padding-x">
                <input type="text" id="caseId" class="cell small-9"
                    placeholder="Enter a case number and see exactly where the incident happened" />
                <button type="button" class="cell small-3 button" @click="addAdressMarker()">See Incident on
                    Map</button>

            </div>
            <div class="grid-x grid-padding-x">
                <div id="leafletmap" class="cell auto"></div>
            </div>
            <br />

            <div class="cell small-2">
                <button class="button" @click="updateTable()"> Update Table </button>
            </div>

            <div class="grid-x grid-padding-x">
                <div class="cell auto">
                    <table>
                        <thead>
                            <tr>
                                <th>Neighborhood</th>
                                <th> Select </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(item) in neighborhoods">
                                <td><label :for="item">{{ item }} </label></td>
                                <td><input type="checkbox" :id="item" :value="item" v-model="filteredNeighborhoods" />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <input type="text" id="maxIncident" placeholder="Incident Limit (default 1000)">
                    <input type="text" id="startDate" placeholder="Start Date (yyyy-mm-dd)">
                    <input type="text" id="endDate" placeholder="End Date (yyyy-mm-dd)">

                </div>
                <div class="cell auto">
                    <table>
                        <thead>
                            <tr>
                                <th>Crime</th>
                                <th> Select </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(item) in incidentCodeRanges">
                                <td><label :for="item">{{ item.crime }} </label></td>

                                <td><input type="checkbox" :id="item" :value="item.crime"
                                        v-model="filteredIncidentTypes" /></td>
                            </tr>
                        </tbody>
                    </table>

                </div>
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
                                <td> {{ item.incident }}</td>
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
            <div class="grid-x grid-padding-x">
                <input type="text" id="casenumberinput" placeholder="Case Number">
                <input type="text" id="dateinput" placeholder="Date (yyyy-mm-dd)">
                <input type="text" id="timeinput" placeholder="Time">
                <input type="text" id="codeinput" placeholder="Code">
                <input type="text" id="incidentinput" placeholder="Incident Type">
                <input type="text" id="gridinput" placeholder="Police Grid">
                <input type="text" id="neighborhoodinput" placeholder="Neighborhood Number">
                <input type="text" id="blockinput" placeholder="Block">
                <button type="button" class="cell small-12 button" @click="uploadIncident()">Upload Incident</button>
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
                    <img src="data/neshuaSmall.jpg" alt="Neshua photo"
                        style="width:15rem; margin-left: auto; margin-right: auto; display: block;">
                    <p style="font-size: 1.25rem; text-align: center">Neshua Aguilar is a senior graduating in May with
                        a major in
                        Computer Science and minor in Data Science.</p>

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
                            <li>The 'map.moveend' event is triggered both after panning and zooming the map</li>
                            <li>There have been no murders in the neighborhood of Conway/Battlecreek/Highwood </li>
                            <li>Sometimes the Nominatim API had a hard time finding a specific location, or it would
                                think the adress is in a different state</li>
                            <li>when we update the page, the specific crime markers go away</li>
                            <li>In a span of five days, from 02/10/2015 to 02/15/2015 there were six crimes in the
                                Highland neighborhood</li>
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
