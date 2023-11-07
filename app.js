const express = require('express')
const crypto = require('crypto')
const url = require('url')
const { v4: uuidv4 } = require('uuid')
const database = require('./utilsMySQL.js')
const shadowsObj = require('./utilsShadows.js')
const Obj = require('./utilsMySQL.js')
const app = express()
const port = 3000

/**
 * TODO: 
 *  - funciona el inicio de sesion ✅
 *  - 
*/

const cookieParser = require('cookie-parser');
const session = require('express-session')
app.use(cookieParser());
app.use(session({
    secret: '34SDgsdgspxxxxxxxdfsG', // just a long random string
    resave: false,
    saveUninitialized: true
}));

// Gestionar usuaris en una variable (caldrà fer-ho a la base de dades)
let hash0 = crypto.createHash('md5').update("1234").digest("hex")
let hash1 = crypto.createHash('md5').update("abcd").digest("hex")
let users = [
  { userName: 'user0', password: hash0, token: '' },
  { userName: 'user1', password: hash1, token: '' }
]

// Inicialitzar objecte de shadows
let shadows = new shadowsObj()

// Crear i configurar l'objecte de la base de dades
var db = new database();
db.init({
  host: "localhost",  // ip portatil clase si estamos ahi
  port: 3306,
  user: "root",
  password: "1234",
  database: "Pr42"
});

// Publicar arxius carpeta ‘public’ 
app.use(express.static('public'));

// Configurar per rebre dades POST en format JSON
app.use(express.json());

// Activar el servidor 
const httpServer = app.listen(port, appListen)
async function appListen () {
  await shadows.init('./public/index.html', './public/shadows');
  console.log(`Example app listening on: http://localhost:${port}`);
}

// Close connections when process is killed
process.on('SIGTERM', shutDown);
process.on('SIGINT', shutDown);
function shutDown() {
  console.log('Received kill signal, shutting down gracefully');
  httpServer.close()
  db.end()
  process.exit(0);
}

// Configurar la direcció '/index-dev.html' per retornar
// la pàgina que descarrega tots els shadows (desenvolupament)
app.get('/index-dev.html', getIndexDev)
async function getIndexDev (req, res) {
  res.setHeader('Content-Type', 'text/html');
  res.send(shadows.getIndexDev())
}

// Configurar la direcció '/shadows.js' per retornar
// tot el codi de les shadows en un sol arxiu
app.get('/shadows.js', getShadows)
async function getShadows (req, res) {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(shadows.getShadows())
}

// Configurar direcció '/hola'
app.get('/hola', hola);
async function hola(req, res) {
  let query = await db.query("SELECT * FROM Users");

  res.send(query);
}
  
// Configurar la direcció '/ajaxCall'
app.post('/ajaxCall', ajaxCall)
async function ajaxCall (req, res) {
  let objPost = req.body;
  objPost["sessionToken"] = req.sessionID
  console.log(req.sessionID)
  let result = ""

  // Simulate delay (1 second)
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Processar la petició
  switch (objPost.callType) {
      case 'actionCheckUserByToken':  result = await actionCheckUserByToken(objPost); break
      case 'actionLogout':            result = await actionLogout(objPost); break
      case 'actionLogin':             result = await actionLogin(objPost); break
      case 'actionSignUp':            result = await actionSignUp(objPost); break
      case 'actionGetTableList':      result = await actionGetTableList(objPost); break
      default:
          result = { result: 'KO', message: 'Invalid callType' }
          break;
  }

  if (result.result === 'KO') {
    switch (result.message) {
      case "El nombre de usuario ya está en uso":
        res.send("error");    //! POR AQUI VOY
    }
  }

  console.log(result)
  // Retornar el resultat
  res.send(result)
}

async function actionCheckUserByToken (objPost) {
  let tokenValue = objPost.token
  // Si troba el token a les dades, retorna el nom d'usuari
  let user = users.find(u => u.token == tokenValue)
  if (!user) {
      return {result: 'KO'}
  } else {
      return {result: 'OK', userName: user.userName}
  }
}

async function actionLogout (objPost) {
  let tokenValue = objPost.token;

  await db.query(`UPDATE Users SET token = '' WHERE token = '${tokenValue}'`);

  // Si troba el token a les dades, retorna el nom d'usuari
  let user = users.find(u => u.token == tokenValue)
  if (!user) {
      return {result: 'OK'}
  } else {
      return {result: 'OK'}
  }
}

async function actionLogin (objPost) {
  let userName = objPost.userName
  let userEmail = objPost.userEmail
  let userPassword = objPost.userPassword
  let userToken = objPost.sessionToken
  console.log(crypto.createHash('md5').update(objPost.userPassword).digest("hex"))
  let query = await db.query(`SELECT * FROM users where name = '${userName}' and mail = "${userEmail}" and pwdHash = "${userPassword}" `)
  if (query.length > 0) {
    let id = query[0].id
    await db.query(`UPDATE users SET token = "${userToken}" WHERE id = "${id}"`)
    return {result: 'OK', userName: userName, token: userToken}
  } else return {result: 'KO'};
  /*
  let userName = objPost.userName
  let userPassword = objPost.userPassword
  let hash = crypto.createHash('md5').update(userPassword).digest("hex")

  // Buscar l'usuari a les dades
  let user = users.find(u => u.userName == userName && u.password == hash)
  if (!user) {
      return {result: 'KO'}
  } else {
    let token = uuidv4()
    user.token = token
    return {result: 'OK', userName: user.userName, token: token}
  }
  */
}



async function actionSignUp(objPost) {
  let userName = objPost.userName;
  let userPassword = objPost.userPassword;
  let hash = crypto.createHash('md5').update(userPassword).digest("hex");
  let email = objPost.userEmail;
  let token = uuidv4();

  // let isRegistered = false;

  console.log("email:", objPost);

  // Afegir l'usuari a les dades
  let user = {userName: userName, password: hash, email: email, token: token};

  let registeredUsers = await db.query('SELECT * FROM Users');
  
  let isRegistered = registeredUsers.filter((regisUser) => regisUser.name === user.userName);

  console.log("isRegistered =", isRegistered);

  if (isRegistered.length == 0) {
    db.query(`INSERT INTO Users (name, mail, pwdHash, token) VALUES ("${user.userName}", "${user.email}", "${user.password}", "${user.token}")`);
    console.log("No está registrado, por lo tanto podemos meterle.");
  } else return {result: 'KO', message: "error"}

  return {result: 'OK', userName: user.userName, email: user.email, token: token};
}

async function actionGetTableList(objPost) {
  let token = objPost.token;
  if (validateToken(token)) {
    let query = await db.query(`SHOW TABLES`)
    console.log(query)
    return {result: 'OK'}
  }
}

async function validateToken(token) {
  let query = await db.query(`SELECT * FROM users WHERE token = '${token}'`)
  return (query.length > 0);
}