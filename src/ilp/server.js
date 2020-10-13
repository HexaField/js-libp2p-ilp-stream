const IlpStream = require('ilp-protocol-stream')
const EventEmitter = require('events')
const Plugin = require('ilp-plugin')
const crypto = require('crypto')

class Server extends EventEmitter {
    constructor() {
        this._plugin = Plugin()
    }

    init() {

        this._plugin.connect().then(() => {

            this._server = new IlpStream.Server({
                plugin: this._plugin,
                serverSecret: crypto.randomBytes(32)
            })
        
            this._server.on('connection', connection => {
                this.emit('connection')
                connection.on('stream', async stream => {
                    const { money, data } = await this._stream.read(stream)
                    const message = await this._handle({ money, data })
                })
            })
        
            await this._server.listen().then
            this.emit('listening')

        })
        return this._server
    }
}

module.exports = { Server }