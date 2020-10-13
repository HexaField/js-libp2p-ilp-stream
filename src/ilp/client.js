const IlpPluginBtp = require('ilp-plugin-btp')
const { createConnection } = require('ilp-protocol-stream')
const { BTPToMultiaddr, multiaddrToBTP } = require('./ilp-multiaddr')
const EventEmitter = require('events')

const DEFAULT_OPTIONS = {

}

class Client extends EventEmitter {
    constructor(options) {
        super()

        this._options = Object.assign({}, clone(DEFAULT_OPTIONS), clone(options))

        /* 
            deconstruct multiaddr
            
            /dns4/127.0.0.1:4000/ws/443/wss/p2p-webrtc-star/
            
            btp+ws://127.0.0.1:4000
        */
    }
}

module.exports = { Client }