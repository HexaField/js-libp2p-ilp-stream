const IlpPluginBtp = require('ilp-plugin-btp')
const { createConnection } = require('ilp-protocol-stream')

async function client (port, info) {
    
    const BATCH_SIZE = 1000
    let totalAmount = 0

    const client = await makeStreamClient({
        server: `btp+ws://127.0.0.1:${port}`,
        btpToken: 'secret'
    }, info)
    const stream = await client.createStream()
    
    sendBatch()

    function sendBatch () {
        _sendBatch()
        .then((elapsed) => {
            console.log('elapsed:', elapsed, 'ms')
            setTimeout(sendBatch, 100)
            if(totalAmount >= 10000)
                process.exit(0)
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

module.exports = { client }