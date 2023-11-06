window.addEventListener('load', init)

function init() {
    console.log("load")
    document.getElementById("loginBtn").addEventListener("click", loginAction)
}

async function loginAction() {
    let username = document.getElementById("userName").value
    let email = document.getElementById("email").value
    let password = document.getElementById("password").value
    let requestData = {
        callType: 'actionLogin',
        username: username,
        email: email,
        password: password
    }
    let resultData = await callServer(requestData)
    if (resultData.result == 'OK') {
        // Guardar el nom d'usuari al LocalStorage i també mostrar-lo
    } else {
        // Esborrar totes les dades del localStorage
    }           
}

async function callServer(requestData) {
    // Fer la petició al servidor
    let resultData = null

    try {
        let result = await fetch('/ajaxCall', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        })
        if (!result.ok) {
            throw new Error(`Error HTTP: ${result.status}`);
        }
        resultData = await result.json()
    } catch (e) {
        console.error('Error at "callServer":', e)
    }
    return resultData
}