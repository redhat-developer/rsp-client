import { NotificationType, NotificationType0, RequestType0, RequestType } from 'vscode-jsonrpc';
import Protocol from './protocol';

export namespace Messages {
    export namespace Server {
        export namespace GetDiscoveryPathsRequest {
            export const type = new RequestType0<Array<Protocol.DiscoveryPath>, void, void>('server/getDiscoveryPaths');
        }

        export namespace FindServerBeansRequest {
            export const type = new RequestType<Protocol.DiscoveryPath, Array<Protocol.ServerBean>, void, void>('server/findServerBeans');
        }

        export namespace AddDiscoveryPathNotification {
            export const type = new NotificationType<Protocol.DiscoveryPath, void>('server/addDiscoveryPath');
        }

        export namespace RemoveDiscoveryPathNotification {
            export const type = new NotificationType<Protocol.DiscoveryPath, void>('server/removeDiscoveryPath');
        }

        export namespace GetServerHandlesRequest {
            export const type = new RequestType0<Array<Protocol.ServerHandle>, void, void>('server/getServerHandles');
        }

        export namespace GetServerTypesRequest {
            export const type = new RequestType0<Array<Protocol.ServerType>, void, void>('server/getServerTypes');
        }

        export namespace DeleteServerNotification {
            export const type = new NotificationType<Protocol.ServerHandle, void>('server/deleteServer');
        }

        export namespace GetRequiredAttributesRequest {
            export const type = new RequestType<Protocol.ServerType, Protocol.Attributes, void, void>('server/getRequiredAttributes');
        }

        export namespace GetOptionalAttributesRequest {
            export const type = new RequestType<Protocol.ServerType, Protocol.Attributes, void, void>('server/getOptionalAttributes');
        }

        export namespace CreateServerRequest {
            export const type = new RequestType<Protocol.ServerAttributes, Protocol.Status, void, void>('server/createServer');
        }

        export namespace GetLaunchModesRequest {
            export const type = new RequestType<Protocol.ServerType, Array<Protocol.ServerLaunchMode>, void, void>('server/getLaunchModes');
        }

        export namespace GetRequiredLaunchAttributesRequest {
            export const type = new RequestType<Protocol.LaunchAttributesRequest, Protocol.Attributes, void, void>('server/getRequiredLaunchAttributes');
        }

        export namespace GetOptionalLaunchAttributesRequest {
            export const type = new RequestType<Protocol.LaunchAttributesRequest, Protocol.Attributes, void, void>('server/getOptionalLaunchAttributes');
        }

        export namespace GetLaunchCommandRequest {
            export const type = new RequestType<Protocol.LaunchParameters, Protocol.CommandLineDetails, void, void>('server/getLaunchCommand');
        }

        export namespace ServerStartingByClientRequest {
            export const type = new RequestType<Protocol.ServerStartingAttributes, Protocol.Status, void, void>('server/serverStartingByClient');
        }

        export namespace ServerStartedByClientRequest {
            export const type = new RequestType<Protocol.LaunchParameters, Protocol.Status, void, void>('server/serverStartedByClient');
        }

        export namespace StartServerAsyncRequest {
            export const type = new RequestType<Protocol.LaunchParameters, Protocol.Status, void, void>('server/startServerAsync');
        }

        export namespace StopServerAsyncRequest {
            export const type = new RequestType<Protocol.StopServerAttributes, Protocol.Status, void, void>('server/stopServerAsync');
        }

        export namespace ShutdownNotification {
            export const type = new NotificationType0<void>('server/shutdown');
        }
    }

    export namespace Client {
        export namespace DiscoveryPathAddedNotification {
            export const type = new NotificationType<Protocol.DiscoveryPath, void>('client/discoveryPathAdded');
        }

        export namespace DiscoveryPathRemovedNotification {
            export const type = new NotificationType<Protocol.DiscoveryPath, void>('client/discoveryPathRemoved');
        }

        export namespace ServerAddedNotification {
            export const type = new NotificationType<Protocol.ServerHandle, void>('client/serverAdded');
        }

        export namespace ServerRemovedNotification {
            export const type = new NotificationType<Protocol.ServerHandle, void>('client/serverRemoved');
        }

        export namespace ServerAttributesChangedNotification {
            export const type = new NotificationType<Protocol.ServerHandle, void>('client/serverAttributesChanged');
        }

        export namespace ServerStateChangedNotification {
            export const type = new NotificationType<Protocol.ServerStateChange, void>('client/serverStateChanged');
        }

        export namespace ServerProcessCreatedNotification {
            export const type = new NotificationType<Protocol.ServerProcess, void>('client/serverProcessCreated');
        }

        export namespace ServerProcessTerminatedNotification {
            export const type = new NotificationType<Protocol.ServerProcess, void>('client/serverProcessTerminated');
        }

        export namespace ServerProcessOutputAppendedNotification {
            export const type = new NotificationType<Protocol.ServerProcessOutput, void>('client/serverProcessOutputAppended');
        }
    }
}