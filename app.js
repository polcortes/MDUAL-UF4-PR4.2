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
const ddbb = "Pr42"

// Crear i configurar l'objecte de la base de dades
var db = new database();
db.init({
  host: "localhost"/*'192.168.19.248'*/,  // ip portatil clase si estamos ahi
  port: 1234/*5306*/,
  user: "root",
  password: "pwd",
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
  
// Configurar la direcció '/ajaxCall'
app.post('/ajaxCall', ajaxCall);
async function ajaxCall(req, res) {
  let objPost = req.body;
  objPost["sessionToken"] = req.sessionID;
  console.log(req.sessionID);
  let result = "";

  // Simulate delay (1 second)
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Processar la petició
  switch (objPost.callType) {
      case 'actionCheckUserByToken':  result = await actionCheckUserByToken(objPost); break
      case 'actionLogout':            result = await actionLogout(objPost); break
      case 'actionLogin':             result = await actionLogin(objPost); break
      case 'actionSignUp':            result = await actionSignUp(objPost); break
      case 'actionGetTableList':      result = await actionGetTableList(objPost); break
      case 'actionGetTableRows':      result = await actionGetTableRows(objPost); break
      case 'editTableRow':            result = await editTableRow(objPost); break
      case 'actionGetTableCols':      result = await actionGetTableCols(objPost); break
      case 'actionAddRow':            result = await actionAddRow(objPost); break
      case 'actionDeleteRow':         result = await actionDeleteRow(objPost); break
      case 'actionCreateTable':       result = await actionCreateTable(objPost); break
      case 'actionDropTable':         result = await actionDropTable(objPost); break
      case 'actionUpdateTable':       result = await actionUpdateTable(objPost); break
      default:
          result = { result: 'KO', message: 'Invalid callType' }
          break;
  }

  if (result.result === 'KO') {
    switch (result.message) {
      case "El nombre de usuario ya está en uso":
        res.send("error");
    }
  }

  console.log(result);
  // Retornar el resultado
  res.send(result);
}


// Define la función para manejar las actualizaciones de la base de datos
app.post('/updateDatabase', updateDatabase);
async function updateDatabase(req, res) {
  try {
    let objPost = req.body;
    let result = await performDatabaseUpdate(objPost);
    res.send(result);
  } catch (error) {
    console.error('Error updating database:', error.message);
    res.status(500).send({ result: 'KO', message: 'Internal Server Error' });
  }
}


// Define la función para realizar la actualización de la base de datos
async function performDatabaseUpdate(data) {
  try {
    // Construye el objeto con los datos a enviar al servidor
    const requestData = {
        callType: 'updateDatabase',
        table: data.table,
        columnName: data.columnName,
        newValue: data.newValue,
        token: data.token
    };

    // Realiza la solicitud al servidor utilizando fetch
    const result = await fetch('http://localhost:3000/updateDatabase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });

    // Maneja la respuesta del servidor
    if (!result.ok) {
        console.error('Error updating database:', result.statusText);
        // Devuelve un objeto con el resultado y un mensaje de error
        return { result: 'KO', message: result.statusText };
    }

    // Maneja la respuesta JSON del servidor
    const responseData = await result.json();

    // Devuelve el resultado de la operación
    return responseData;
  } catch (error) {
    console.error('Error performing database update:', error.message);
    // Devuelve un objeto con el resultado y un mensaje de error
    return { result: 'KO', message: 'Internal Server Error' };
  }
}
  
  // async function performDatabaseUpdate(data) {
  //     try {
  //         // Realiza la lógica necesaria para actualizar la base de datos
  //         // Puedes usar los datos proporcionados en el objeto 'data'
  
  //         // Ejemplo: Actualizar la base de datos con el nuevo valor
  //         // await db.query(`UPDATE ${data.table} SET ${data.columnName} = "${data.newValue}" WHERE token = '${data.token}'`);
  
  //         // Devolver un objeto con el resultado de la operación
  //         return { result: 'OK' };
  //     } catch (error) {
  //         console.error('Error performing database update:', error.message);
  //         // Devolver un objeto con el resultado y un mensaje de error
  //         return { result: 'KO', message: 'Internal Server Error' };
  //     }
  // }
  
  
  async function actionGetTableRows(objPost) {
    let token = objPost.token
  if (validateToken(token)) {
    console.log(objPost.table)
    let query = await db.query(`SELECT * FROM ${objPost.table}`);
    let columnNamesQuery = await db.query(`DESCRIBE ${objPost.table}`);
    let columnNames = columnNamesQuery.map(column => column.Field)
    let tableRows = []
    for (let i = 0; i < query.length; i++) {
      tableRows.push(query[i])
    }
    return {result: 'OK', columnNames: columnNames, tableRows: tableRows};
  }
  return {result: 'KO'}
}

async function actionAddRow(objPost) {
  let token = objPost.token
  if (validateToken(token)) {
    console.log(objPost.data)
    let queryText = `INSERT INTO ${objPost.table} (`
    for (let i = 0; i < objPost.data.length; i++) {
      queryText += objPost.data[i].field
      if (i != objPost.data.length - 1) {
        queryText += ", "
      }
    }
    queryText += ") VALUES ("
    for (let i = 0; i < objPost.data.length; i++) {
      queryText += "'" + objPost.data[i].value + "'"
      if (i != objPost.data.length - 1) {
        queryText += ", "
      }
    }
    queryText += ")"
    let query = await db.query(queryText)
    return {result: 'OK'}
  }
  return {result: 'KO'}
}

async function actionDeleteRow(objPost) {
  let token = objPost.token
  if (validateToken(token)) {
    console.log(objPost.table)
    let query = await db.query(`DELETE FROM ${objPost.table} WHERE id = '${objPost.id}'`);
    return {result: 'OK'};
  }
  return {result: 'KO'}
}

async function actionCreateTable(objPost) {
  let token = objPost.token
  if (validateToken(token)) {
    let queryText = `CREATE TABLE IF NOT EXISTS \`${objPost.tableName}\` (\`id\` int NOT NULL AUTO_INCREMENT, `
    for (let i = 0; i < objPost.tableCols.length; i++) {
      queryText += `\`${objPost.tableCols[i]}\` char(255), `
    }
    queryText += "PRIMARY KEY (`id`));"
    let query = await db.query(queryText);
    return {result: 'OK'};
  }
  return {result: 'KO'}
}

async function actionUpdateTable(objPost) {
  console.log(objPost.tableNameOld)
  console.log(objPost.tableNameNew)
  let token = objPost.token
  if (validateToken(token)) {
    if (objPost.tableNameOld != objPost.tableNameNew) {
      let query = await db.query(`RENAME TABLE ${objPost.tableNameOld} TO \`${objPost.tableNameNew}\`;`);
      await db.query('COMMIT;')
      console.log("query", query)
    }
    return {result: 'OK'};
  }
  return {result: 'KO'}
}

async function actionDropTable(objPost) {
  let token = objPost.token
  if (validateToken(token)) {
    let query = await db.query(`DROP TABLE ${objPost.tableName}`);
    return {result: 'OK'};
  }
  return {result: 'KO'}
}

async function actionGetTableCols(objPost) {
  let token = objPost.token
  if (validateToken(token)) {
    console.log(objPost.table)
    let query = await db.query(`SHOW COLUMNS FROM ${objPost.table}`)
    console.log(query)
    let tableRows = []
    for (let i = 0; i < query.length; i++) {
      if (query[i].Field != "id") {
        tableRows.push(query[i].Field)
      }
    }
    return {result: 'OK', tableRows: tableRows}
  }
  return {result: 'KO'}
}

async function actionAddRow(objPost) {
  let token = objPost.token
  if (validateToken(token)) {
    console.log(objPost.data)
    let queryText = `INSERT INTO ${objPost.table} (`
    for (let i = 0; i < objPost.data.length; i++) {
      queryText += objPost.data[i].field
      if (i != objPost.data.length - 1) {
        queryText += ", "
      }
    }
    queryText += ") VALUES ("
    for (let i = 0; i < objPost.data.length; i++) {
      queryText += "'" + objPost.data[i].value + "'"
      if (i != objPost.data.length - 1) {
        queryText += ", "
      }
    }
    queryText += ")"
    let query = await db.query(queryText)
    return {result: 'OK'}
  }
  return {result: 'KO'}
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

  await db.query(`UPDATE users SET token = '' WHERE token = '${tokenValue}'`);

  // Si troba el token a les dades, retorna el nom d'usuari
  let user = users.find(u => u.token == tokenValue)
  if (!user) {
      return {result: 'OK'}
  } else {
      return {result: 'OK'}
  }
}

// async function editTableRow(objPost) {
//   try {
//     let token = objPost.token;
//     let columnName = objPost.columnName;
//     let newValue = objPost.newValue;

//     if (validateToken(token)) {
//       // Realizar la actualización en la base de datos
//       await db.query(`UPDATE ${objPost.table} SET ${columnName} = "${newValue}" WHERE token = '${token}'`);
      
//       return { result: 'OK' };
//     } else {
//       return { result: 'KO', message: 'Invalid token' };
//     }
//   } catch (error) {
//     console.error('Error editing table row:', error.message);
//     return { result: 'KO', message: 'Internal Server Error' };
//   }
// }

async function editTableRow(objPost) {
  try {
    let token = objPost.token;
    let columnName = objPost.columnName;
    let newValue = objPost.newValue;

    if (validateToken(token)) {
      // Realizar la actualización en la base de datos
      await db.query(`UPDATE ${objPost.table} SET ${columnName} = "${newValue}" WHERE token = '${token}'`);

      return { result: 'OK' };
    } else {
      return { result: 'KO', message: 'Invalid token' };
    }
  } catch (error) {
    console.error('Error editing table row:', error.message);
    return { result: 'KO', message: 'Internal Server Error' };
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
    let tableList = []
    for (let i = 0; i < query.length; i++) {
      tableList.push(query[i][`Tables_in_${ddbb}`])
    }
    return {result: 'OK', tableList: tableList} 
  }
}

async function actionGetAllAreas(objPost) {
  
}

async function validateToken(token) {
  let query = await db.query(`SELECT * FROM users WHERE token = '${token}'`);
  return (query.length > 0);
}