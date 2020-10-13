const { Server } = require('./server')
const EventEmitter = require('events')

async function ilp () {

    async function connect() {

    }

    function createServer(callback) {
        const server = new Server()
        server.init().then((conn) => { 
            callback()
        })
        return server
    }
    
}

modules.export = ilp