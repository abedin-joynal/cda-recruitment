if('serviceWorker' in navigator){
    navigator.serviceWorker
    // give complete path of sw.js file
    .register('http://192.168.1.13:4000/pwa3/sw.js')
    .then(() => console.log('Service Worker Registered'))
}

let deferredPromt;
const addBtn = document.querySelector('.installApp')
addBtn.style.display = 'none'

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPromt = e;
    addBtn.style.display = 'block'

    addBtn.addEventListener('click', () => {
        addBtn.style.display = 'none';
        deferredPromt.prompt();
        deferredPromt.userChoice.then((choiceResult) => {
            if(choiceResult.outcome === 'accepted'){
                console.log('App is installing');
            }else{
                console.log('User dismissed the prompt');
            }
            deferredPromt = null;
        })
    })
})