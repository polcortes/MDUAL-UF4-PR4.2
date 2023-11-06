class gestorbbdd extends HTMLElement {
    constructor() {
        super()
        this.shadow = this.attachShadow({ mode: 'open' })
    }

    async connectedCallback() {
        // Carrega els estils CSS
        const style = document.createElement('style')
        style.textContent = await fetch('/shadows/gestorbbdd.css').then(r => r.text())
        this.shadow.appendChild(style)
    
        // Carrega els elements HTML
        const htmlContent = await fetch('/shadows/gestorbbdd.html').then(r => r.text())

        // Converteix la cadena HTML en nodes utilitzant un DocumentFragment
        const template = document.createElement('template');
        template.innerHTML = htmlContent;
        
        // Clona i afegeix el contingut del template al shadow
        this.shadow.appendChild(template.content.cloneNode(true));
    }
}

// Defineix l'element personalitzat
customElements.define('user-login', UserLogin)