import { Protocol } from '../protocol/generated/protocol';
import { Messages } from '../protocol/generated/messages';
import { ErrorMessages } from '../protocol/generated/outgoing';
import { Common } from './common';
import { MessageConnection } from 'vscode-jsonrpc';
import { EventEmitter } from 'events';
import { ServerState } from '../protocol/generated/serverState';

/**
 * Server Outgoing async.
 * As of now this file is NOT auto-generated
 */
export class OutgoingSynchronous {

    private connection: MessageConnection;
    private emitter: EventEmitter;

     /**
     * Constructs a new discovery handler
     * @param connection message connection to the RSP
     * @param emitter event emitter to handle notification events
     */
    constructor(connection: MessageConnection, emitter: EventEmitter) {
        this.connection = connection;
        this.emitter = emitter;
    }

    /**
     * Synchronously adds discovery path to RSP by sending a notification and then waiting for
     * 'discoveryPathAdded' event to be fired
     * @param path path to the desired directory
     * @param timeout timeout in milliseconds
     */
    addDiscoveryPathSync(path: string, timeout: number = Common.DEFAULT_TIMEOUT): Promise<Protocol.DiscoveryPath> {
        const discoveryPath = { filepath: path };
        const listener = (param: Protocol.DiscoveryPath) => {
            return param.filepath === discoveryPath.filepath;
        };
        return Common.sendRequestSync(this.connection, Messages.Server.AddDiscoveryPathRequest.type, discoveryPath,
            this.emitter, 'discoveryPathAdded', listener, timeout, ErrorMessages.ADDDISCOVERYPATH_TIMEOUT);
    }

    /**
     * Synchronously removes discovery path from RSP by sending a notification and then waiting for
     * 'discoveryPathRemoved' event to be fired
     * @param path path to the desired directory or a DiscoveryPath object containing the given filepath
     * @param timeout timeout in milliseconds
     */
    removeDiscoveryPathSync(path: string | Protocol.DiscoveryPath, timeout: number = Common.DEFAULT_TIMEOUT): Promise<Protocol.DiscoveryPath> {
        let discoveryPath: Protocol.DiscoveryPath;
        if (typeof(path) === 'string') {
            discoveryPath = { filepath: path };
        } else {
            discoveryPath = path;
        }
        const listener = (param: Protocol.DiscoveryPath) => {
            return param.filepath === discoveryPath.filepath;
        };

        return Common.sendRequestSync(this.connection, Messages.Server.RemoveDiscoveryPathRequest.type, discoveryPath, this.emitter,
            'discoveryPathRemoved', listener, timeout, ErrorMessages.REMOVEDISCOVERYPATH_TIMEOUT);
    }

    /**
     * Sends a request to start the given server and waits for 'serverStateChanged' event
     * until the server's state has changed to 'started'
     * @param launchParameters parameters to start the server with, see {@link Protocol.LaunchParameters}
     * @param timeout timeout in milliseconds
     */
    startServerSync(launchParameters: Protocol.LaunchParameters, timeout: number = Common.VERY_LONG_TIMEOUT): Promise<Protocol.ServerState> {
        return new Promise<Protocol.ServerState>((resolve, reject) => {
            const timer = setTimeout(() => {
                return reject(new Error(ErrorMessages.STARTSERVERASYNC_TIMEOUT));
            }, timeout);

            let result: Thenable<Protocol.StartServerResponse>;
            const listener = (state: Protocol.ServerState) => {
                if (state.server.id === launchParameters.params.id && state.state === ServerState.STARTED) {
                    result.then(() => {
                        clearTimeout(timer);
                        this.emitter.removeListener('serverStateChanged', listener);
                        resolve(state);
                    });
                }
            };
            this.emitter.prependListener('serverStateChanged', listener);
            result = this.connection.sendRequest(Messages.Server.StartServerAsyncRequest.type, launchParameters);
        });
    }

    /**
     * Sends a request to stop the given server and waits for 'serverStateChanged' event
     * until the server's state has changed to 'stopped'
     * @param stopParameters server stopping parameters, set force to 'true' to force shutdown, see {@link Protocol.StopServerAttributes}
     * @param timeout timeout in milliseconds
     */
    stopServerSync(stopParameters: Protocol.StopServerAttributes, timeout: number = Common.VERY_LONG_TIMEOUT): Promise<Protocol.ServerState> {
        return new Promise<Protocol.ServerState>((resolve, reject) => {
            const timer = setTimeout(() => {
                return reject(new Error(ErrorMessages.STOPSERVERASYNC_TIMEOUT));
            }, timeout);

            let result: Thenable<Protocol.Status>;
            const listener = (state: Protocol.ServerState) => {
                if (state.server.id === stopParameters.id && state.state === ServerState.STOPPED) {
                    result.then(() => {
                        clearTimeout(timer);
                        this.emitter.removeListener('serverStateChanged', listener);
                        resolve(state);
                    });
                }
            };
            this.emitter.prependListener('serverStateChanged', listener);
            result = this.connection.sendRequest(Messages.Server.StopServerAsyncRequest.type, stopParameters);
        });
    }

    /**
     * Sends notification to remove a server from RSP, then waits for the appropriate 'serverRemoved' event
     * @param serverHandle server handle containing the server id and type, see {@link Protocol.ServerHandle}
     * @param timeout timeout in milliseconds
     */
    deleteServerSync(serverHandle: Protocol.ServerHandle, timeout: number = Common.DEFAULT_TIMEOUT): Promise<Protocol.ServerHandle> {
        const listener = (param: Protocol.ServerHandle) => {
            return param.id === serverHandle.id;
        };
        return Common.sendRequestSync(this.connection, Messages.Server.DeleteServerRequest.type, serverHandle, this.emitter,
            'serverRemoved', listener, timeout, ErrorMessages.DELETESERVER_TIMEOUT);
    }
}