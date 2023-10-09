const express = require('express');
const ejs = require("ejs");
const url = require("url");
const app = express();
const port = 3000;
const fs = require('fs/promises');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 } // Tamaño máximo en bytes (1 MB en este ejemplo)
});

app.set('view engine', 'ejs');
app.use(express.static('public'));

// cosas

// Activar el servidor
const httpServer = app.listen(port, appListen)
function appListen () {
    console.log(`Example app listening on: http://localhost:${port}`)
}