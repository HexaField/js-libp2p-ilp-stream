const PluginMiniAccounts = require('ilp-plugin-mini-accounts')
const IlpPluginBtp = require('ilp-plugin-btp')
const { createConnection, createServer, Connection } = require('ilp-protocol-stream')


const STREAM_PORT = 9001
const HTTP_PORT = 9002

runStreamServer().then((info) => {
    runClient(info)
})

async function runStreamServer () {
    const serverPlugin = new PluginMiniAccounts({
        port: STREAM_PORT,
        allowedOrigins: ['.*'],
        debugHostIldcpInfo: {
        clientAddress: 'test.example',
        assetScale: 9,
        assetCode: '___'
        }
    })
    const server = await createServer({ plugin: serverPlugin })
    server.on('connection', (connection) => {
        console.log('new connection')
        connection.on('stream', (stream) => {
            console.log('new stream')
            stream.setReceiveMax(1000)
            stream.on('money', (amount) => { 
                // process.stdout.write(amount + ',') 
            })
        })
    })
    return server.generateAddressAndSecret()
}

async function runClient (info) {
    
    const BATCH_SIZE = 1000
    let totalAmount = 0

    const client = await makeStreamClient({
        server: `btp+ws://127.0.0.1:${STREAM_PORT}`,
        btpToken: 'secret'
    }, info)
    const stream = await client.createStream()
    
    sendBatch()

    function sendBatch () {
        _sendBatch()
        .then((elapsed) => {
            console.log('elapsed:', elapsed, 'ms')
            setTimeout(sendBatch, 100)
        })
        .catch((err) => console.error('sendTotal error:', err.stack))
    }

    async function _sendBatch () {
        const start = Date.now()
        for (let i = 0; i < BATCH_SIZE; i++) {
            await stream.sendTotal(++totalAmount)
        }
        return (Date.now() - start) / BATCH_SIZE
    }
  
    async function makeStreamClient (btpOpts, opts) {
        const clientPlugin = new IlpPluginBtp(btpOpts)
        return await createConnection({
            plugin: clientPlugin,
            destinationAccount: opts.destinationAccount,
            sharedSecret: Buffer.from(opts.sharedSecret, 'base64'),
            slippage: 0
        })
    }
}