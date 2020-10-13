'use strict'

const ilp = require('./ilp')
const mafmt = require('./ilp/ilp-multiaddr-verifier')
const withIs = require('class-is')
const errCode = require('err-code')
const log = require('debug')('libp2p:ilp')
const toConnection = require('./socket-to-conn')
const createListener = require('./listener')
const { multiaddrToILPConfig } = require('./utils')
const { AbortError } = require('abortable-iterator')
const { CODE_CIRCUIT, CODE_P2P } = require('./constants')

/**
 * @class ILP
 */
class ILP {
  /**
   * @constructor
   * @param {object} options
   * @param {Upgrader} options.upgrader
   */
  constructor ({ upgrader }) {
    if (!upgrader) {
      throw new Error('An upgrader must be provided. See https://github.com/libp2p/interface-transport#upgrader.')
    }
    this._upgrader = upgrader
  }

  /**
   * @async
   * @param {Multiaddr} ma
   * @param {object} options
   * @param {AbortSignal} options.signal Used to abort dial requests
   * @returns {Connection} An upgraded Connection
   */
  async dial (ma, options) {
    options = options || {}
    const socket = await this._connect(ma, options)
    const maConn = toConnection(socket, { remoteAddr: ma, signal: options.signal })
    log('new outbound connection %s', maConn.remoteAddr)
    const conn = await this._upgrader.upgradeOutbound(maConn)
    log('outbound connection %s upgraded', maConn.remoteAddr)
    return conn
  }

  /**
   * @private
   * @param {Multiaddr} ma
   * @param {object} options
   * @param {AbortSignal} options.signal Used to abort dial requests
   * @returns {Promise<Socket>} Resolves an ILP peer
   */
  _connect (ma, options = {}) {
    if (options.signal && options.signal.aborted) {
      throw new AbortError()
    }

    return new Promise((resolve, reject) => {
      const start = Date.now()
      const cOpts = multiaddrToILPConfig(ma)

      log('dialing %j', cOpts)
      const rawSocket = ilp.connect(cOpts)

      const onError = err => {
        err.message = `connection error ${cOpts.host}:${cOpts.port}: ${err.message}`
        done(err)
      }

      const onTimeout = () => {
        log('connnection timeout %s:%s', cOpts.host, cOpts.port)
        const err = errCode(new Error(`connection timeout after ${Date.now() - start}ms`), 'ERR_CONNECT_TIMEOUT')
        // Note: this will result in onError() being called
        rawSocket.emit('error', err)
      }

      const onConnect = () => {
        log('connection opened %j', cOpts)
        done()
      }

      const onAbort = () => {
        log('connection aborted %j', cOpts)
        rawSocket.destroy()
        done(new AbortError())
      }

      const done = err => {
        rawSocket.removeListener('error', onError)
        rawSocket.removeListener('timeout', onTimeout)
        rawSocket.removeListener('connect', onConnect)
        options.signal && options.signal.removeEventListener('abort', onAbort)

        if (err) return reject(err)
        resolve(rawSocket)
      }

      rawSocket.on('error', onError)
      rawSocket.on('timeout', onTimeout)
      rawSocket.on('connect', onConnect)
      options.signal && options.signal.addEventListener('abort', onAbort)
    })
  }

  /**
   * Creates a ILP listener. The provided `handler` function will be called
   * anytime a new incoming Connection has been successfully upgraded via
   * `upgrader.upgradeInbound`.
   * @param {*} [options]
   * @param {function(Connection)} handler
   * @returns {Listener} An ILP listener
   */
  createListener (options, handler) {
    if (typeof options === 'function') {
      handler = options
      options = {}
    }
    options = options || {}
    return createListener({ handler, upgrader: this._upgrader }, options)
  }

  /**
   * Takes a list of `Multiaddr`s and returns only valid ILP addresses
   * @param {Multiaddr[]} multiaddrs
   * @returns {Multiaddr[]} Valid ILP multiaddrs
   */
  filter (multiaddrs) {
    multiaddrs = Array.isArray(multiaddrs) ? multiaddrs : [multiaddrs]

    return multiaddrs.filter(ma => {
      if (ma.protoCodes().includes(CODE_CIRCUIT)) {
        return false
      }

      return mafmt.ILP.matches(ma.decapsulateCode(CODE_P2P))
    })
  }
}

module.exports = withIs(ILP, { className: 'ILP', symbolName: '@hexafield/js-libp2p-ilp-transport/ilp' })