import {Plugin, Client} from '@bugsnag/core'

declare const BugsnagPluginGoogleCloudFunctions: Plugin
export default BugsnagPluginGoogleCloudFunctions

type HttpFunction = (req: any, res: any) => Promise<any>
type ExpressApplication = (req, res, next) => any
type EventFunction = (data: any, context: any) => Promise<any>
type CallbackFunction = (err?: Error | string | null, response?: any) => void
type EventFunctionWithCallback = (data: any, context: any, callback: CallbackFunction) => void
type CloudEventFunction = (cloudEvent: any) => Promise<any>
type CloudEventFunctionWithCallback = (cloudEvent: any, callback: CallbackFunction) => void

export type BugsnagPluginGoogleCloudFunctionsHttpHandler = (handler: HttpFunction | ExpressApplication) => HttpFunction
export type BugsnagPluginGoogleCloudFunctionsEventHandler = (handler: EventFunction | EventFunctionWithCallback) => EventFunction | EventFunctionWithCallback
export type BugsnagPluginGoogleCloudFunctionsCloudEventHandler = (handler: CloudEventFunction | CloudEventFunctionWithCallback) => CloudEventFunction | CloudEventFunctionWithCallback

export interface BugsnagPluginGoogleCloudFunctionsConfiguration {
    flushTimeoutMs?: number
}

export interface BugsnagPluginGoogleCloudFunctionsResult {
    createHttpHandler(configuration?: BugsnagPluginGoogleCloudFunctionsConfiguration): BugsnagPluginGoogleCloudFunctionsHttpHandler

    createEventHandler(configuration?: BugsnagPluginGoogleCloudFunctionsConfiguration): BugsnagPluginGoogleCloudFunctionsEventHandler

    createCloudEventHandler(configuration?: BugsnagPluginGoogleCloudFunctionsConfiguration): BugsnagPluginGoogleCloudFunctionsCloudEventHandler
}

// add a new call signature for the getPlugin() method that types the plugin result
declare module '@bugsnag/core' {
    interface Client {
        getPlugin(id: 'googleCloudFunctions'): BugsnagPluginGoogleCloudFunctionsResult | undefined
    }
}
