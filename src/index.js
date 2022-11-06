const domain = require('domain')
const bugsnagInFlight = require('@bugsnag/in-flight')
const extractRequestInfo = require('./request-info')

const defaultFlushTimeoutMs = 2000

const BugsnagPluginGoogleCloudFunctions = {
  name: 'googleCloudFunctions',
  load (client) {
    // Keep track of in-flight requests
    bugsnagInFlight.trackInFlight(client)

    // Reset the app duration between invocations, if the plugin is loaded
    const appDurationPlugin = client.getPlugin('appDuration')

    if (appDurationPlugin)
      appDurationPlugin.reset()

    return {
      createHttpHandler ({ flushTimeoutMs = defaultFlushTimeoutMs } = {}) {
        return wrapHttpHandler.bind(null, client, flushTimeoutMs)
      },
      createEventHandler ({ flushTimeoutMs = defaultFlushTimeoutMs } = {}) {
        return wrapEventHandler.bind(null, client, flushTimeoutMs)
      },
      createCloudEventHandler ({ flushTimeoutMs = defaultFlushTimeoutMs } = {}) {
        return wrapCloudEventHandler.bind(null, client, flushTimeoutMs)
      },
    }
  },
}

function wrapHttpHandler (client, flushTimeoutMs, handler) {
  return function (req, res) {
    client.addOnError((event) => {
      const { metadata, request } = getRequestAndMetadataFromReq(req)
      event.request = { ...event.request, ...request }
      event.addMetadata('request', metadata)
    })

    const onError = function (err) {
      if (!client._config.autoDetectErrors || !client._config.enabledErrorTypes.unhandledExceptions)
        return

      const handledState = {
        severity: 'error',
        unhandled: true,
        severityReason: { type: 'unhandledException' },
      }

      const event = client.Event.create(err, true, handledState, 'google cloud functions plugin', 1)

      const { metadata, request } = getRequestAndMetadataFromReq(req)
      event.request = { ...event.request, ...request }
      event.addMetadata('request', metadata)

      client._notify(event)
    }

    return execute(client, flushTimeoutMs, onError, handler, req, res)
  }
}

function wrapEventHandler (client, flushTimeoutMs, handler) {
  const onError = function (err) {
    if (!client._config.autoDetectErrors || !client._config.enabledErrorTypes.unhandledExceptions)
      return

    const handledState = {
      severity: 'error',
      unhandled: true,
      severityReason: { type: 'unhandledException' },
    }

    const event = client.Event.create(err, true, handledState, 'google cloud functions plugin', 1)

    client._notify(event)
  }

  if (handler.length > 2) {
    return function (data, context, callback) {
      client.addMetadata('cloud functions event metadata', context)

      const _callback = function (err, data) {
        if (err)
          throw err
        callback(null, data)
      }

      return execute(client, flushTimeoutMs, onError, handler, data, context, _callback)
    }
  }

  return function (data, context) {
    client.addMetadata('cloud functions event metadata', context)
    return execute(client, flushTimeoutMs, onError, handler, data, context)
  }
}

function wrapCloudEventHandler (client, flushTimeoutMs, handler) {
  const onError = function (err) {
    if (!client._config.autoDetectErrors || !client._config.enabledErrorTypes.unhandledExceptions)
      return

    const handledState = {
      severity: 'error',
      unhandled: true,
      severityReason: { type: 'unhandledException' },
    }

    const event = client.Event.create(err, true, handledState, 'google cloud functions plugin', 1)

    client._notify(event)
  }

  if (handler.length > 1) {
    return function (cloudEvent, callback) {
      const { data, ...rest } = cloudEvent
      client.addMetadata('cloud functions event metadata', rest)

      const _callback = function (err, data) {
        if (err)
          throw err
        callback(null, data)
      }

      return execute(client, flushTimeoutMs, onError, handler, cloudEvent, _callback)
    }
  }

  return function (cloudEvent) {
    const { data, ...rest } = cloudEvent
    client.addMetadata('cloud functions event metadata', rest)
    return execute(client, flushTimeoutMs, onError, handler, cloudEvent)
  }
}

async function execute (client, flushTimeoutMs, onError, handler, ..._arguments) {
  if (client._config.autoTrackSessions)
    client.startSession()

  return new Promise((resolve, reject) => {
    const dom = domain.create()

    dom.on('error', (err) => {
      reject(err)
      onError(err)
    })

    dom.run(() => {
      process.nextTick(async () => {
        try {
          const result = await handler(..._arguments)
          resolve(result)
        } catch (err) {
          throw err
        } finally {
          try {
            await bugsnagInFlight.flush(flushTimeoutMs)
          } catch (err) {
            client._logger.error(`Delivery may be unsuccessful: ${err.message}`)
          }
        }
      })
    })
  })
}

function getRequestAndMetadataFromReq (req) {
  const { body, ...requestInfo } = extractRequestInfo(req)
  return {
    metadata: requestInfo,
    request: {
      body,
      clientIp: requestInfo.clientIp,
      headers: requestInfo.headers,
      httpMethod: requestInfo.httpMethod,
      url: requestInfo.url,
      referer: requestInfo.referer,
    },
  }
}

module.exports = BugsnagPluginGoogleCloudFunctions

// add a default export for ESM modules without interop
module.exports.default = module.exports
