const { server, client } = require('.')

async function test(port) {
    const info = await server(port)
    await client(port, info)
}

test(4000)