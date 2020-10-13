'use strict'

const multiaddr = require('multiaddr')
const os = require('os')
const { resolve } = require('path')
const ProtoFamily = { ip4: 'IPv4', ip6: 'IPv6' }

function multiaddrToILPConfig (addr) {
  const listenPath = addr.getPath()
  // unix socket listening
  if (listenPath) {
    return resolve(listenPath)
  }
  // tcp listening
  return addr.toOptions()
}

function getMultiaddrs (proto, ip, port) {
  const toMa = ip => multiaddr(`/${proto}/${ip}/ilp/${port}`)
  return (isAnyAddr(ip) ? getILPAddrs(ProtoFamily[proto]) : [ip]).map(toMa)
}

function isAnyAddr (ip) {
  return ['0.0.0.0', '::'].includes(ip)
}

/**
 * @private
 * @param {string} family One of ['IPv6', 'IPv4']
 * @returns {string[]} an array of ip address strings
 */
function getILPAddrs (family) {
  return Object.values(os.networkInterfaces()).reduce((addresses, ilpAddrs) => {
    ilpAddrs.forEach(ilpAddr => {
      // Add the ip of each matching network interface
      if (ilpAddr.family === family) addresses.push(ilpAddr.address)
    })
    return addresses
  }, [])
}

module.exports = {
  multiaddrToILPConfig,
  isAnyAddr,
  getMultiaddrs
}