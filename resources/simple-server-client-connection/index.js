const { client } = require('./client')
const { server } = require('./server')

async function test() {
    const port = 4000
    const info = await server(port)
    await client(port, info)
}
test()