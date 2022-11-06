# bugsnag-plugin-google-cloud-functions

A [@bugsnag/js](https://github.com/bugsnag/bugsnag-js) plugin for capturing errors in Google Cloud Functions.

## Quickstart

Install and configure [@bugsnag/js](https://www.npmjs.com/package/@bugsnag/js), then install the Google Cloud Functions
plugin using npm or yarn:

```shell
npm install bugsnag-plugin-google-cloud-functions
```

```shell
yarn add bugsnag-plugin-google-cloud-functions
```

To start Bugsnag with the Google Cloud Functions, pass the plugin to `Bugsnag.start`:

```javascript
const Bugsnag = require('@bugsnag/js')
const BugsnagPluginGoogleCloudFunctions = require('bugsnag-plugin-google-cloud-functions')

Bugsnag.start({
  apiKey: 'YOUR_API_KEY',
  plugins: [BugsnagPluginGoogleCloudFunctions],
  otherOptions: value
})
```

Start handling errors in your Google Cloud Functions function by wrapping your handler with Bugsnag handler identical by
signature type:

```javascript
const functions = require('@google-cloud/functions-framework')

const bugsnagHandler = Bugsnag.getPlugin('googleCloudFunctions').createHttpHandler()
functions.http('httpFunction', bugsnagHandler((req, res) => {}))
```

```javascript
const bugsnagHandler = Bugsnag.getPlugin('googleCloudFunctions').createEventHandler()
exports.backgroundFunction = bugsnagHandler((data, context) => {})
exports.backgroundFunction = bugsnagHandler((data, context, callback) => {})
```

```javascript
const functions = require('@google-cloud/functions-framework')

const bugsnagHandler = Bugsnag.getPlugin('googleCloudFunctions').createCloudEventHandler()
functions.cloudEvent('cloudEventFunction', bugsnagHandler((cloudEvent) => {}))
functions.cloudEvent('cloudEventFunction', bugsnagHandler((cloudEvent, callback) => {}))
```

## Data capture

The Bugsnag Google Cloud Functions plugin will automatically capture the function request in the "Request" tab for HTTP
function and the function event metadata in the "Cloud Functions event metadata" tab for Event-driven function on every
error.

## Session tracking

A session will be reported automatically each time your Google Cloud Functions function is called. This behavior can be
disabled using
the [`autoTrackSessions`](https://docs.bugsnag.com/platforms/javascript/configuration-options/#autotracksessions)
configuration option.

## Configuration

The Bugsnag Google Cloud Functions plugin can be configured by passing options to createHandler.

### `flushTimeoutMs`

Bugsnag will wait for events and sessions to be delivered before allowing the Google Cloud Functions function to exit.

This option can be used to control the maximum amount of time to wait before timing out.

By default, Bugsnag will timeout after 2000 milliseconds.

```javascript
const bugsnagHandler = Bugsnag.getPlugin('googleCloudFunctions').createHttpHandler({
  flushTimeoutMs: 5000
})
```

If a timeout does occur, Bugsnag will log a warning and events & sessions may not be delivered.

## License

[UNLICENSE](UNLICENSE)
