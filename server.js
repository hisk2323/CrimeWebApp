// Built-in Node.js modules
let fs = require('fs');
let path = require('path');

// NPM modules
let express = require('express');
let sqlite3 = require('sqlite3');


let db_filename = path.join(__dirname, 'db', 'stpaul_crime.sqlite3');

let app = express();
let port = 8000;

//Express will automatically parse the data to a json object
app.use(express.json());

// Open SQLite3 database (in read-write mode)
let db = new sqlite3.Database(db_filename, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.log('Error opening ' + path.basename(db_filename));
    }
    else {
        console.log('Now connected to ' + path.basename(db_filename));
    }
});


// GET request handler for crime codes
app.get('/codes', (req, res) => {
    console.log(req.query); // query object (key-value pairs after the ? in the url)
    if (req.query.hasOwnProperty('code')) {
        let params = [req.query.code];
        let query = 'SELECT Codes.code AS code, Codes.incident_type AS type FROM Codes WHERE code IN (' + params.join(',') + ') ORDER BY code;';
        databaseSelect(query).then((rows) => {
            res.status(200).type('json').send(rows);
        }).catch((err) => {
            console.log(err);
        });
    } else {
        let query = 'SELECT Codes.code AS code, Codes.incident_type AS type FROM Codes ORDER BY code;'
        databaseSelect(query).then((rows) => {
            res.status(200).type('json').send(rows);
        }).catch((err) => {
            console.log(err);
        });
    }
});

// GET request handler for neighborhoods
app.get('/neighborhoods', (req, res) => {
    console.log(req.query); // query object (key-value pairs after the ? in the url)
    if (req.query.hasOwnProperty('id')) {
        let params = [req.query.id];
        let query = 'SELECT Neighborhoods.neighborhood_number AS id, Neighborhoods.neighborhood_name AS name \
        FROM Neighborhoods WHERE neighborhood_number IN (' + params.join(',') + ') \
        ORDER BY neighborhood_number;';
        databaseSelect(query).then((rows) => {
            res.status(200).type('json').send(rows);
        }).catch((err) => {
            console.log(err);
        });
    } else {
        let query = 'SELECT Neighborhoods.neighborhood_number AS id, Neighborhoods.neighborhood_name AS name \
        FROM Neighborhoods ORDER BY id;'
        databaseSelect(query).then((rows) => {
            res.status(200).type('json').send(rows);
        }).catch((err) => {
            console.log(err);
        });
    }
});

// GET request handler for crime incidents
app.get('/incidents', (req, res) => {
    console.log(req.query); // query object (key-value pairs after the ? in the url)
    let query = "SELECT case_number, date(date_time) AS date, time(date_time) AS time, code, incident, \
    police_grid, neighborhood_number, block FROM Incidents ORDER BY date_time LIMIT 1000;";
    databaseSelect(query).then((rows) => {
        res.status(200).type('json').send(rows);
    }).catch((err) => {
        console.log(err);
    })
    // res.status(200).type('json').send({}); // <-- you will need to change this
});

// PUT request handler for new crime incident
app.put('/new-incident', (req, res) => {
    console.log(req.body); // uploaded data by user, should be in json format
    
    res.status(200).type('txt').send('OK'); // <-- you may need to change this
});

// DELETE request handler for new crime incident
app.delete('/remove-incident', (req, res) => {
    console.log(req.body); // uploaded data
    
    res.status(200).type('txt').send('OK'); // <-- you may need to change this
});


// Create Promise for SQLite3 database SELECT query 
function databaseSelect(query, params) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(rows);
            }
        });
    })
}

// Create Promise for SQLite3 database INSERT or DELETE query
function databaseRun(query, params) {
    return new Promise((resolve, reject) => {
        db.run(query, params, (err) => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    })
}


// Start server - listen for client connections
app.listen(port, () => {
    console.log('Now listening on port ' + port);
});
