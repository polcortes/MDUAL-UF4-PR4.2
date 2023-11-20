// const { restart } = require("nodemon")

let self;

class UserLogin extends HTMLElement {
    getTableListFlag = true
    selectedTable = ""
    constructor() {
        super()
        this.shadow = this.attachShadow({ mode: 'open' })
    }

    async connectedCallback() {
        // Carrega els estils CSS
        const style = document.createElement('style')
        style.textContent = await fetch('/shadows/userLogin.css').then(r => r.text())
        this.shadow.appendChild(style)
    
        // Carrega els elements HTML
        const htmlContent = await fetch('/shadows/userLogin.html').then(r => r.text())

        // Converteix la cadena HTML en nodes utilitzant un DocumentFragment
        const template = document.createElement('template');
        template.innerHTML = htmlContent;
        
        // Clona i afegeix el contingut del template al shadow
        this.shadow.appendChild(template.content.cloneNode(true));

        // Definir els 'eventListeners' dels objectes 
        // NO es pot fer des de l'HTML, al ser shadow no funciona
        // Es recomana fer-ho amb '.bind(this, paràmetres ...)' per simplificar les crides a les funcions
        this.shadow.querySelector('#infoBtnLogOut').addEventListener('click', this.actionLogout.bind(this))
        this.shadow.querySelector('#tableBtnLogOut').addEventListener('click', this.actionLogout.bind(this))
        this.shadow.querySelector('#loginForm').addEventListener('submit', this.actionLogin.bind(this))
        this.shadow.querySelector('#loginBtn').addEventListener('click', this.actionLogin.bind(this))
        this.shadow.querySelector('#loginShowSignUpForm').addEventListener('click', this.showView.bind(this, 'viewSignUpForm', 'initial'))
        this.shadow.querySelector('#signUpForm').addEventListener('submit', this.actionLogin.bind(this))
        this.shadow.querySelector('#signUpPassword').addEventListener('input', this.checkSignUpPasswords.bind(this))
        this.shadow.querySelector('#signUpPasswordCheck').addEventListener('input', this.checkSignUpPasswords.bind(this))
        this.shadow.querySelector('#signUpBtn').addEventListener('click', this.actionSignUp.bind(this))
        this.shadow.querySelector('#signUpShowLoginForm').addEventListener('click', this.showView.bind(this, 'viewLoginForm', 'initial'))
        this.shadow.querySelector('#tableBtnAddRow').addEventListener('click', this.actionOpenAddRow.bind(this))
        this.shadow.querySelector('#tableBtnGoBack').addEventListener('click', this.actionGoStart.bind(this))
        this.shadow.querySelector('#addTableBtnGoBack').addEventListener('click', this.actionGoStart.bind(this))
        this.shadow.querySelector('#addRowBtnGoBack').addEventListener('click', this.actionGoStart.bind(this))
        this.shadow.querySelector('#tableBtnLogOut').addEventListener('click', this.actionLogout.bind(this))
        this.shadow.querySelector('#tableBtnGoBack').addEventListener('click', this.actionGetTableList.bind(this, 'viewTable', 'initial'))
        this.shadow.querySelectorAll('.tableRowEdit').forEach(el => el.addEventListener("change", this.editTableRow.bind(this)));
        this.shadow.querySelector('#tableBtnGoBack').addEventListener('click', this.actionGetTableList.bind(this, 'viewTable', 'initial'))
        this.shadow.querySelector('#infoBtnAddTable').addEventListener('click', this.actionOpenAddTable.bind(this))
        this.shadow.querySelector('#addTableBtnAddColumn').addEventListener('click', this.addTableColumn.bind(this))
        this.shadow.querySelector('#addTableBtnSave').addEventListener('click', this.actionSaveTable.bind(this))
        this.shadow.querySelector('#addRowBtnSave').addEventListener('click', this.actionSaveRow.bind(this))


        // Automàticament, validar l'usuari per 'token' (si n'hi ha)
        await this.actionCheckUserByToken()
    } 

    checkSignUpPasswords() {
        // Valida que les dues contrasenyes del 'signUp' siguin iguals
        let refPassword = this.shadow.querySelector('#signUpPassword')
        let refPasswordCheck = this.shadow.querySelector('#signUpPasswordCheck')

        if (refPassword.value == refPasswordCheck.value) {
            this.setViewSignUpStatus('initial');
        } else {
            this.setViewSignUpStatus('passwordError');
        }
    }

    setUserInfo(userName, token) {
        // Guarda o neteja les dades del localStorage
        if (userName != "") {
            window.localStorage.setItem("userName", userName)
            window.localStorage.setItem("token", token)
            this.setViewInfoStatus('logged')
        } else {
            window.localStorage.clear()
            this.setViewInfoStatus('notLogged')
        }
    }

    setViewInfoStatus(status) {
        // Gestiona les diferents visualitzacions de la vista 'viewInfo'
        let refUserName = this.shadow.querySelector('#infoUser')
        let refLoading = this.shadow.querySelector('#infoLoading')
        let refButton = this.shadow.querySelector('#infoBtnLogOut')

        console.log(refLoading)


        switch (status) {
        case 'loading':
            refUserName.innerText = ""
            refLoading.style.opacity = 1
            refButton.disabled = true
            break
        case 'logged':
            if (this.getTableListFlag) {
                this.actionGetTableList()
                this.getTableListFlag = false
            }
            refUserName.innerText = window.localStorage.getItem("userName")
            refLoading.style.opacity = 0
            refButton.disabled = false
            break
        case 'notLogged':
            refUserName.innerText = ""
            refLoading.style.opacity = 0
            refButton.disabled = true
            break
        }
    }

    setViewLoginStatus(status) {
        // Gestiona les diferents visualitzacions de la vista 'viewLoginForm'
        let refError = this.shadow.querySelector('#loginError')
        let refLoading = this.shadow.querySelector('#loginLoading')
        let refButton = this.shadow.querySelector('#loginBtn')

        switch (status) {
        case 'initial':
            refError.style.opacity = 0
            refLoading.style.opacity = 0
            refButton.disabled = false
            break
        case 'loading':
            refError.style.opacity = 0
            refLoading.style.opacity = 1
            refButton.disabled = true
            break
        case 'error':
            refError.style.opacity = 1
            refLoading.style.opacity = 0
            refButton.disabled = true
            break
        }
    }

    setViewSignUpStatus(status) {
        // Gestiona les diferents visualitzacions de la vista 'viewSignUpForm'
        let refPasswordError = this.shadow.querySelector('#signUpPasswordError')
        let refError = this.shadow.querySelector('#signUpError')
        let refLoading = this.shadow.querySelector('#signUpLoading')
        let refButton = this.shadow.querySelector('#signUpBtn')

        switch (status) {
        case 'initial':
            refPasswordError.style.opacity = 0
            refError.style.opacity = 0
            refLoading.style.opacity = 0
            refButton.disabled = false
            break
        case 'loading':
            refPasswordError.style.opacity = 0
            refError.style.opacity = 0
            refLoading.style.opacity = 1
            refButton.disabled = true
            break
        case 'passwordError':
            refPasswordError.style.opacity = 0
            refError.style.opacity = 1
            refLoading.style.opacity = 1
            refButton.disabled = true
        case 'error':
            refPasswordError.style.opacity = 0
            refError.style.opacity = 1
            refLoading.style.opacity = 0
            refButton.disabled = true
            break
        }
    }

    setViewTableStatus(status) {
        let tableRows = this.shadow.getElementById("tableRows");
        let loading = this.shadow.getElementById("tableLoading")
        switch(status) {
            case 'load':
                loading.style.opacity = 0
                this.actionGetTableRows()
            case 'loading':
                loading.style.opacity = 1
            case 'loaded':
                loading.style.opacity = 0
        }
    }

    setViewAddRowStatus(status) {
        let addRowList = this.shadow.getElementById("addRowList")
        let loading = this.shadow.getElementById("addRowLoading")

        switch(status) {
            case 'load':
                loading.style.opacity = 0
                this.actionOpenAddRow()
            case 'loading':
                loading.style.opacity = 1
            case 'loaded':
                loading.style.opacity = 0
        }
    }
    

    showView(viewName, viewStatus) {
        // Amagar totes les vistes
        this.shadow.querySelector('#viewInfo').style.display = 'none'
        this.shadow.querySelector('#viewLoginForm').style.display = 'none'
        this.shadow.querySelector('#viewSignUpForm').style.display = 'none'
        this.shadow.querySelector('#viewTable').style.display = 'none'
        this.shadow.querySelector('#viewAddRow').style.display = 'none'
        this.shadow.querySelector('#viewAddTable').style.display = 'none'

        // Mostrar la vista seleccionada, amb l'status indicat
        switch (viewName) {
        case 'viewInfo':
            this.shadow.querySelector('#viewInfo').style.removeProperty('display')
            this.setViewInfoStatus(viewStatus)
            break
        case 'viewLoginForm':
            this.shadow.querySelector('#viewLoginForm').style.removeProperty('display')
            this.setViewLoginStatus(viewStatus)
            break
        case 'viewSignUpForm':
            /*if (viewStatus === "error") {

            } else {*/
                this.shadow.querySelector('#viewSignUpForm').style.removeProperty('display')
                this.setViewSignUpStatus(viewStatus)
            //}
            break
        case 'viewTable':
            this.shadow.querySelector('#viewTable').style.removeProperty('display')
            this.setViewTableStatus(viewStatus)
            break
        case 'viewAddRow':
            this.shadow.querySelector('#viewAddRow').style.removeProperty('display')
            this.setViewAddRowStatus(viewStatus)
            break
        case 'viewAddTable':
            this.shadow.querySelector('#viewAddTable').style.removeProperty('display')
            this.resetAddTableList();
        }
    }

    resetAddTableList() {
        this.shadow.querySelector('#addTableColumnList').innerHTML = "<li id='column-0'><input type='text' class='addTableColumn'></li>"
    }

    addTableColumn() {
        let deleteColumnButtonList = this.shadow.querySelectorAll('.deleteColumn')
        let item = document.createElement("li")
        item.id = `column-${deleteColumnButtonList.length+1}`
        item.innerHTML = `<input type='text' class='addTableColumn'><button class='deleteColumn' id="deleteCol-${deleteColumnButtonList.length+1}">Eliminar columna</button>`
        this.shadow.querySelector('#addTableColumnList').append(item)
        deleteColumnButtonList = this.shadow.querySelectorAll('.deleteColumn')
        for (let i = 0; i < deleteColumnButtonList.length; i++) {
            console.log(deleteColumnButtonList[i])
            deleteColumnButtonList[i].addEventListener('click', this.deleteColumn.bind(this, i+1))
        }
    }

    deleteColumn(columnNum) {
        this.shadow.querySelector(`#column-${columnNum}`).remove()
    }

    async actionSaveTable() {
        let columnsList = this.shadow.querySelectorAll(".addTableColumn")
        let tableName = this.shadow.getElementById("tableName").value
        let data = []
        for (let i = 0; i < columnsList.length; i++) {
            data.push(columnsList[i].value)
        }
        let tokenValue = window.localStorage.getItem("token")
        if (tokenValue) {
            let requestData = {
                callType: 'actionCreateTable',
                tableName: tableName,
                tableCols: data,
                token: tokenValue
            }
            let resultData = await this.callServer(requestData)
            if (resultData.result == 'OK') {
                this.getTableListFlag = true;
                this.showView('viewInfo', 'logged')
            } else {
                // Esborrar totes les dades del localStorage
                this.setUserInfo('', '')
                this.showView('viewLoginForm', 'initial')
            }           
        } else {
            // No hi ha token de sessió, mostrem el 'loginForm'
            this.setUserInfo('', '')
            this.showView('viewLoginForm', 'initial')
        }
    }

    async actionGoStart() {
        this.getTableListFlag = true;
        this.showView('viewInfo', 'logged')
        this.setViewInfoStatus('logged')
    }

    async editTableRow(event) {
        try {
            const editedInput = event.target;
    
            const newValue = editedInput.value;
    
            const columnName = editedInput.previousSibling.textContent.replace(':', '').trim();
            const rowData = {
                columnName: columnName,
                newValue: newValue,
                table: this.selectedTable,
                token: window.localStorage.getItem('token')
            };
    
            const result = await this.updateDatabase(rowData);
    
            if (result.result === 'OK') {
                console.log('Database updated successfully.');
            } else {
                console.error('Error updating database:', result.message);
            }
        } catch (error) {
            console.error('Error updating database:', error.message);
        }
    }

    async actionGetTableRows() {
        this.showView('viewTable', 'loading')
        let tokenValue = window.localStorage.getItem("token")
        if (tokenValue) {
            let requestData = {
                callType: 'actionGetTableRows',
                table: this.selectedTable,
                token: tokenValue
            }
            let resultData = await this.callServer(requestData)
            let tableRows = this.shadow.getElementById("tableRows")
            tableRows.innerHTML = ""
            if (resultData.result == 'OK') {
                for (const row of resultData.tableRows) {
                    // Itera sobre las columnas
                    for (const columnName of resultData.columnNames) {
                        // Accede al valor correspondiente en la fila actual
                        const value = row[columnName];
                        tableRows.innerHTML += `<label>${columnName}: <input type="text" class="tableRowEdit" value="${value}"></label><br />`
                    }
                    tableRows.innerHTML += `<button class="deleteRow" id="${row.id}">Eliminar fila</button>`
                    tableRows.innerHTML += `<hr />`;
                }
                this.shadow.querySelectorAll('.tableRowEdit').forEach(el => el.addEventListener('input', this.editTableRow.bind(this)));
                let deleteButtonList = this.shadow.querySelectorAll(".deleteRow")
                for (let i = 0; i < deleteButtonList.length; i++) {
                    deleteButtonList[i].addEventListener('click', this.actionDeleteRow.bind(this, deleteButtonList[i].id))
                }
                this.setViewTableStatus('loaded')
            } else {
                // Esborrar totes les dades del localStorage
                this.setUserInfo('', '')
                this.showView('viewLoginForm', 'initial')
            }           
        } else {
            // No hi ha token de sessió, mostrem el 'loginForm'
            this.setUserInfo('', '')
            this.showView('viewLoginForm', 'initial')
        }
    }

    async actionDeleteRow(rowId) {
        if (confirm('Estàs segur de voler borrar aquesta fila?')) {
            let tokenValue = window.localStorage.getItem("token")
            if (tokenValue) {
                let requestData = {
                    callType: 'actionDeleteRow',
                    table: this.selectedTable,
                    id: rowId,
                    token: tokenValue
                }
                let resultData = await this.callServer(requestData)
                if (resultData.result == 'OK') {
                    this.actionGetTableRows();
                } else {
                    // Esborrar totes les dades del localStorage
                    this.setUserInfo('', '')
                    this.showView('viewLoginForm', 'initial')
                }           
            } else {
                // No hi ha token de sessió, mostrem el 'loginForm'
                this.setUserInfo('', '')
                this.showView('viewLoginForm', 'initial')
            }
        }
        
    }

    
    async updateDatabase(rowData) {
        try {
            const result = await fetch('/updateDatabase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(rowData)
            });
    
            if (!result.ok) {
                console.error('Error updating database:', result.statusText);
                // Puedes manejar el error según tus necesidades
                return { result: 'KO', message: result.statusText };
            }
    
            const responseData = await result.json();
    
            return responseData;
        } catch (error) {
            console.error('Error updating database:', error.message);
            // Puedes manejar el error según tus necesidades
            return { result: 'KO', message: 'Internal Server Error' };
        }
    }

    async actionOpenAddRow() {
        this.showView('viewAddRow', 'loading')
        let tokenValue = window.localStorage.getItem("token")
        if (tokenValue) {
            let requestData = {
                callType: 'actionGetTableCols',
                table: this.selectedTable,
                token: tokenValue
            }
            let resultData = await this.callServer(requestData)
            let addRowList = this.shadow.getElementById("addRowList")
            addRowList.innerHTML = ""
            if (resultData.result == 'OK') {
                for (let i = 0; i < resultData.tableRows.length; i++) {
                    addRowList.innerHTML += `<li><label>${resultData.tableRows[i]} </label><input type="text" id="${resultData.tableRows[i]}"></li>`
                }
                this.showView('viewAddRow', 'loaded')
            } else {
                // Esborrar totes les dades del localStorage
                this.setUserInfo('', '')
                this.showView('viewLoginForm', 'initial')
            }           
        } else {
            // No hi ha token de sessió, mostrem el 'loginForm'
            this.setUserInfo('', '')
            this.showView('viewLoginForm', 'initial')
        }
    }

    async actionOpenAddTable() {
        this.showView('viewAddTable', 'loading')
    }

    async actionSaveRow() {
        let data = []
        let inputList = this.shadow.querySelectorAll("#addRowList li input")
        console.log(inputList)
        for (let i = 0; i < inputList.length; i++) {
            data.push({field: inputList[i].id, value: inputList[i].value})
        }
        let tokenValue = window.localStorage.getItem("token")
        if (tokenValue) {
            let requestData = {
                callType: 'actionAddRow',
                table: this.selectedTable,
                data: data,
                token: tokenValue
            }
            let resultData = await this.callServer(requestData)
            if (resultData.result == 'OK') {
                console.log("SAVE COMPLETE")
                this.showView("viewInfo", "logged")
            } else {
                // Esborrar totes les dades del localStorage
                this.setUserInfo('', '')
                this.showView('viewLoginForm', 'initial')
            }           
        } else {
            // No hi ha token de sessió, mostrem el 'loginForm'
            this.setUserInfo('', '')
            this.showView('viewLoginForm', 'initial')
        }
    }

    async actionCheckUserByToken() {
        // Mostrar la vista amb status 'loading'
        this.showView('viewInfo', 'loading')

        // Identificar usuari si hi ha "token" al "LocalStorage"
        let tokenValue = window.localStorage.getItem("token")
        if (tokenValue) {
            let requestData = {
                callType: 'actionCheckUserByToken',
                token: tokenValue
            }
            let resultData = await this.callServer(requestData)
            if (resultData.result == 'OK') {
                // Guardar el nom d'usuari al LocalStorage i també mostrar-lo
                this.setUserInfo(resultData.userName, tokenValue)
                this.setViewInfoStatus('logged')
            } else {
                // Esborrar totes les dades del localStorage
                this.setUserInfo('', '')
                this.showView('viewLoginForm', 'initial')
            }           
        } else {
            // No hi ha token de sessió, mostrem el 'loginForm'
            this.setUserInfo('', '')
            this.showView('viewLoginForm', 'initial')
        }
    }

    async actionLogout() {
        // Mostrar la vista amb status 'loading'
        this.showView('viewInfo', 'loading')

        // Identificar usuari si hi ha "token" al "LocalStorage"
        let tokenValue = window.localStorage.getItem("token")
        if (tokenValue) {
            let requestData = {
                callType: 'actionLogout',
                token: tokenValue
            }
            await this.callServer(requestData)
        } 

        // Tan fa la resposta, esborrem les dades
        this.setUserInfo('', '')
        this.showView('viewLoginForm', 'initial')
    }

    async actionLogin() {
        let refUserName = this.shadow.querySelector('#loginUserName')
        let refUserEmail = this.shadow.querySelector('#loginEmail')
        let refPassword = this.shadow.querySelector('#loginPassword')

        // Mostrar la vista
        this.showView('viewLoginForm', 'loading')

        let requestData = {
            callType: 'actionLogin',
            userName: refUserName.value,
            userEmail: refUserEmail.value,
            userPassword: refPassword.value
        }

        let resultData = await this.callServer(requestData)
        if (resultData.result == 'OK') {
            this.setUserInfo(resultData.userName, resultData.token)
            this.showView('viewInfo', 'logged')
        } else {
            // Esborrar el password
            refPassword.value = ""

            // Mostrar l'error dos segons
            this.showView('viewLoginForm', 'error')
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Mostrar el formulari de login 'inicial'
            this.showView('viewLoginForm', 'initial')
        }           
    }

    async actionSignUp() {
        let refSignUpUserName = this.shadow.querySelector('#signUpUserName');
        let refEmail = this.shadow.querySelector('#signUpEmail');
        let refPassword = this.shadow.querySelector('#signUpPassword');

        // Mostrar la vista
        this.showView('viewSignUpForm', 'loading');

        let requestData = {
            callType: 'actionSignUp',
            userName: refSignUpUserName.value,
            userEmail: refEmail.value,
            userPassword: refPassword.value
        }

        let resultData = await this.callServer(requestData)
        if (resultData.result == 'OK') {
            this.setUserInfo(resultData.userName, resultData.token)
            this.showView('viewInfo', 'logged')
        } else {
            // Esborrar el password
            refPassword.value = ""
          
            // Mostrar l'error dos segons
            this.showView('viewSignUpForm', 'error')
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Mostrar el formulari de signUp 'inicial'
            this.showView('viewSignUpForm', 'initial')
        }           
    }

    async actionGetTableList() {

        let self = this

        this.showView('viewInfo', 'loading');

        let requestData = {
            callType: 'actionGetTableList',
            token: window.localStorage.getItem('token')
        }
        let tableList = this.shadow.getElementById("tableList")
        let resultData = await this.callServer(requestData)
        if (resultData.result == 'OK') {
            tableList.innerHTML = "";
            for (let i = 0; i < resultData.tableList.length; i++) {
                tableList.innerHTML += `<li><input class="tableName" id="tableName-${i}" value="${resultData.tableList[i]}"><button class="openTableButton" id="${resultData.tableList[i]}">Obrir taula</button><button class="deleteTableButton" id="${resultData.tableList[i]}">Eliminar taula</button></li>`
            }

            let tables = this.shadow.querySelectorAll(".openTableButton")
            for (let i = 0; i < tables.length; i++) {
                tables[i].addEventListener("click", function() {
                    console.log(this)
                    self.selectedTable = this.id
                    self.showView('viewTable', 'load')
                })
            }

            let deleteTableListButtonList = this.shadow.querySelectorAll(".deleteTableButton")
            for (let i = 0; i < deleteTableListButtonList.length; i++) {
                deleteTableListButtonList[i].addEventListener("click", self.actionDropTable.bind(self, resultData.tableList[i],))
            }

            let inputList = this.shadow.querySelectorAll(".tableName")
            for (let i = 0; i < inputList.length; i++) {
                inputList[i].addEventListener("change", self.actionUpdateTable.bind(self, resultData.tableList[i], inputList[i].id, self))
            }
        } else {
            /*
            // Esborrar el password
            refPassword.value = ""
          
            // Mostrar l'error dos segons
            this.showView('viewInfoForm', 'error')
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Mostrar el formulari de signUp 'inicial'
            this.showView('viewInfoForm', 'initial')
            */
        }
        this.setViewInfoStatus('logged')      
    }

    async actionUpdateTable(tableNameOld, inputId, self) {
            let inputList = this.shadow.querySelectorAll(".tableName")
            for (let i = 0; i < inputList.length; i++) {
                inputList[i].addEventListener("change", self.actionUpdateTable.bind(self, inputList[i].value, inputList[i].id, self))
            }
            let tableNameNew = this.shadow.getElementById(inputId).value
            let tokenValue = window.localStorage.getItem("token")
            if (tokenValue) {
                let requestData = {
                    callType: 'actionUpdateTable',
                    tableNameOld: tableNameOld,
                    tableNameNew: tableNameNew,
                    token: tokenValue
                }
                let resultData = await this.callServer(requestData)
                if (resultData.result == 'OK') {
                    console.log("Done")
                } else {
                    // Esborrar totes les dades del localStorage
                    this.setUserInfo('', '')
                    this.showView('viewLoginForm', 'initial')
                }           
            } else {
                // No hi ha token de sessió, mostrem el 'loginForm'
                this.setUserInfo('', '')
                this.showView('viewLoginForm', 'initial')
            }
        
    }

    async actionDropTable(tableName) {
        if (confirm('Estàs segur de voler eliminar aquesta taula?')) {
            let tokenValue = window.localStorage.getItem("token")
            if (tokenValue) {
                let requestData = {
                    callType: 'actionDropTable',
                    tableName: tableName,
                    token: tokenValue
                }
                let resultData = await this.callServer(requestData)
                if (resultData.result == 'OK') {
                    this.actionGetTableList();
                } else {
                    // Esborrar totes les dades del localStorage
                    this.setUserInfo('', '')
                    this.showView('viewLoginForm', 'initial')
                }           
            } else {
                // No hi ha token de sessió, mostrem el 'loginForm'
                this.setUserInfo('', '')
                this.showView('viewLoginForm', 'initial')
            }
        }
    }

    async actionGetAllAreas() {
        this.showView('viewInfo', 'loading');

        let requestData = {
            callType: 'actionGetAllAreas',
            table: ""
        }
    }

    async callServer(requestData) {
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
}

// Defineix l'element personalitzat
customElements.define('user-login', UserLogin)