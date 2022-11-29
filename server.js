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
    let query;
    if (Object.keys(req.query).length === 0) { // empty query
        query = "SELECT case_number, date(date_time) AS date, time(date_time) AS time, code, incident, police_grid, neighborhood_number, block FROM Incidents LIMIT 1000;";
    } else {
        query = "SELECT case_number, date(date_time) AS date, time(date_time) AS time, code, incident, police_grid, neighborhood_number, block FROM Incidents WHERE";

        params = ['0000-00-00', '9999-99-99', 'SELECT DISTINCT code FROM Incidents', 'SELECT DISTINCT police_grid FROM Incidents', 'SELECT DISTINCT neighborhood_number FROM Incidents', '1000'];

        if (req.query.hasOwnProperty('start_date')) {
            params[0] = req.query.start_date;
        }

        if (req.query.hasOwnProperty('end_date')) {
            params[1] = req.query.end_date;
        }

        if (req.query.hasOwnProperty('code')) {
            params[2] = req.query.code;
        }

        if (req.query.hasOwnProperty('grid')) {
            params[3] = req.query.grid;
        }

        if (req.query.hasOwnProperty('neighborhood')) {
            params[4] = req.query.neighborhood;
        }

        if (req.query.hasOwnProperty('limit')) {
            params[5] = req.query.limit;
        }

        query += ' date(date_time) >= "' + params[0] + '" AND date(date_time) <= "' + params[1] + '" AND code IN (' + params[2] + ') AND police_grid IN (' +
        params[3] +') AND neighborhood_number IN (' + params[4] + ') LIMIT ' + params[5] + ';';

        console.log(query);
    }

    databaseSelect(query).then((rows) => {
        res.status(200).type('json').send(rows);
    }).catch((err) => {
        console.log(err);
    })
});

// PUT request handler for new crime incident
app.put('/new-incident', (req, res) => {
    console.log(req.body); // uploaded data by user, should be in json format
    userData = req.body;
    let query = 'INSERT INTO Incidents(case_number, date, time, code, incident, police_grid, \
                neighborhood_number, block) VALUES (' + userData.case_number + ', ' + userData.date + ',  \
                ' + userData.time + ', ' + userData.code + ', ' + userData.incident + ', ' + userData.police_grid +
                ', '+ userData.neighborhood_number + ', '+ userData.block + ')' 
    try {
        res.json(validateIncident(userData));
        databaseRun(query).then(console.log('incident created succesfully'))

      } catch(err) {
        console.error('Error while adding incident', err.message);
        next(err);
      }

    // console.log(req.body);
    // res.status(200).type('txt').send('OK'); // <-- you may need to change this
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
function validateIncident(incident) {
    let messages = [];
  
    console.log(incident);
  
    if (!incident) {
      messages.push('No object is provided');
    }
  
    if (!incident.case_number) {
      messages.push('case_number is empty');
    }
  
    if (!incident.date) {
      messages.push('date is empty');
    }
    
    if (!incident.time) {
        messages.push('time is empty');
    }

    if (!incident.code) {
        messages.push('code is empty');
    }

    if (!incident.incident) {
        messages.push('incident is empty');
    }

    if (!incident.police_grid) {
        messages.push('police_grid is empty');
    }

    if (!incident.neighborhood_number) {
        messages.push('neighborhood_number is empty');
    }

    if (!incident.block) {
        messages.push('block is empty');
    }

    if (messages.length) {
      let error = new Error(messages.join());
      error.statusCode = 400;
  
      throw error;
    }
  }


// Start server - listen for client connections
app.listen(port, () => {
    console.log('Now listening on port ' + port);
});
