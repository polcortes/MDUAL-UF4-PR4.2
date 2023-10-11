const express = require('express');
const url = require('url');
const { v4: uuidv4 } = require('uuid');
const database = require('./utilsMySQL.js');
const app = express();
const port = 3000;

// Crear i configurar l'objecte de la base de dades
var db = new database();
db.init({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "pwd",
    database: "Pr42"
});

// Publicar arxius carpeta ‘public’
app.use(express.static('public'));

// Configurar per rebre dades POST en format JSON
app.use(express.json);

// Configurar direcció '/testDB'
app.get('/testDB', testDB)
async function testDB (req, res) {
    let rst = await db.query('SELECT * FROM city LIMIT 10')
    res.send(rst)
}

// Activar el servidor
const httpServer = app.listen(port, appListen)
function appListen () {
    console.log(`Example app listening on: http://localhost:${port}`)
}

// Close connections when process is killed
process.on('SIGTERM', shutDown);
process.on('SIGINT', shutDown);
function shutDown() {
    console.log('Shutting down gracefully');
    httpServer.close();
    db.end();
    process.exit(0);
}