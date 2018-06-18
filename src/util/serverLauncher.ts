import { MessageConnection } from 'vscode-jsonrpc';
import Protocol from '../protocol/protocol';
import { Messages } from '../protocol/messages';
import { ServerStatus } from '../protocol/serverState';
import { EventEmitter } from 'events';
import { Common, ErrorMessages } from './common';

/**
 * Server launching handler
 */
export class ServerLauncher {

    private connection: MessageConnection;
    private emitter: EventEmitter;

    /**
     * Constructs a new server launch handler
     * @param connection message connection to the SSP
     * @param emitter event emitter to handle notification events
     */
    constructor(connection: MessageConnection, emitter: EventEmitter) {
        this.connection = connection;
        this.emitter = emitter;
        this.listenToServerChanges();
    }

    /**
     * Subscribes to server process notifications
     */
    private listenToServerChanges() {
        this.connection.onNotification(Messages.Client.ServerProcessCreatedNotification.type, process => {
            this.emitter.emit('serverProcessCreated', process);
        });

        this.connection.onNotification(Messages.Client.ServerProcessOutputAppendedNotification.type, output => {
            this.emitter.emit('serverOutputAppended', output);
        });

        this.connection.onNotification(Messages.Client.ServerProcessTerminatedNotification.type, process => {
            this.emitter.emit('serverProcessTerminated', process);
        });

        this.connection.onNotification(Messages.Client.ServerAttributesChangedNotification.type, handle => {
            this.emitter.emit('serverAttributesChanged', handle);
        });

        this.connection.onNotification(Messages.Client.ServerStateChangedNotification.type, state => {
            this.emitter.emit('serverStateChanged', state);
        });
    }

    /**
     * Retrieves possible launch modes for a given server type
     * @param serverType object representing the server type, see {@link Protocol.ServerType}
     * @param timeout timeout in milliseconds
     */
    getLaunchModes(serverType: Protocol.ServerType, timeout: number = 2000): Promise<Protocol.ServerLaunchMode[]> {
        return Common.sendSimpleRequest(this.connection, Messages.Server.GetLaunchModesRequest.type, serverType,
             timeout, ErrorMessages.GETLAUNCHMODES_TIMEOUT);
    }

    /**
     * Retrieves required launch attributes for a given server
     * @param launchAttrRequest object containing id and launch mode of a server, see {@link Protocol.LaunchAttributesRequest}
     * @param timeout timeout in milliseconds
     */
    getRequiredLaunchAttributes(launchAttrRequest: Protocol.LaunchAttributesRequest, timeout: number = 2000): Promise<Protocol.Attributes> {
        return Common.sendSimpleRequest(this.connection, Messages.Server.GetRequiredLaunchAttributesRequest.type, launchAttrRequest,
            timeout, ErrorMessages.GETREQUIREDLAUNCHATTRS_TIMEOUT);
    }

    /**
     * Retrieves optional launch attributes for a given server
     * @param launchAttrRequest object containing id and launch mode of a server, see {@link Protocol.LaunchAttributesRequest}
     * @param timeout timeout in milliseconds
     */
    getOptionalLaunchAttributes(launchAttrRequest: Protocol.LaunchAttributesRequest, timeout: number = 2000): Promise<Protocol.Attributes> {
        return Common.sendSimpleRequest(this.connection, Messages.Server.GetOptionalLaunchAttributesRequest.type, launchAttrRequest,
            timeout, ErrorMessages.GETOPTIONALLAUNCHATTRS_TIMEOUT);
    }

    /**
     * Retrieves launch command for a given server to be used in a CLI
     * @param launchParameters object containing the given server attributes for launching, see {@link Protocol.LaunchParameters}
     * @param timeout timeout in milliseconds
     */
    getLaunchCommand(launchParameters: Protocol.LaunchParameters, timeout: number = 2000): Promise<Protocol.CommandLineDetails> {
        return Common.sendSimpleRequest(this.connection, Messages.Server.GetLaunchCommandRequest.type, launchParameters,
            timeout, ErrorMessages.GETLAUNCHCOMMAND_TIMEOUT);
    }

    /**
     * Notifies the SSP a server is being started manually by the client
     * @param startingAttributes launch parameters, set the 'initiatePolling' property to allow SSP to manage the server's state,
     * see {@link Protocol.ServerStartingAttributes}
     * @param timeout timeout in milliseconds
     */
    serverStartingByClient(startingAttributes: Protocol.ServerStartingAttributes, timeout: number = 2000): Promise<Protocol.Status> {
        return Common.sendSimpleRequest(this.connection, Messages.Server.ServerStartingByClientRequest.type, startingAttributes,
            timeout, ErrorMessages.SERVERSTARTINGBYCLIENT_TIMEOUT);
    }

    /**
     * Notifies the SSP a server has been started manually by the client
     * @param launchPatameters parameters the server has been started with, see {@link Protocol.LaunchParameters}
     * @param timeout timeout in milliseconds
     */
    serverStartedByClient(launchParameters: Protocol.LaunchParameters, timeout: number = 2000): Promise<Protocol.Status> {
        return Common.sendSimpleRequest(this.connection, Messages.Server.ServerStartedByClientRequest.type, launchParameters,
            timeout, ErrorMessages.SERVERSTARTEDBYCLIENT_TIMEOUT);
    }

    /**
     * Sends a request to start the given server. Subscribe to the 'serverStateChanged' event
     * to monitor the server's state changes
     * @param launchParameters parameters to start the server with, see {@link Protocol.LaunchParameters}
     * @param timeout timeout in milliseconds
     */
    startServerAsync(launchParameters: Protocol.LaunchParameters, timeout: number = 2000): Promise<Protocol.Status> {
        return Common.sendSimpleRequest(this.connection, Messages.Server.StartServerAsyncRequest.type, launchParameters,
            timeout, ErrorMessages.STARTSERVER_TIMEOUT);
    }

    /**
     * Sends a request to start the given server and waits for 'serverStateChanged' event
     * until the server's state has changed to 'started'
     * @param launchParameters parameters to start the server with, see {@link Protocol.LaunchParameters}
     * @param timeout timeout in milliseconds
     */
    startServerSync(launchParameters: Protocol.LaunchParameters, timeout: number = 60000): Promise<Protocol.ServerStateChange> {
        const timer = setTimeout(() => {
            return Promise.reject(`Failed to send server start request from ${launchParameters.params.id} in time`);
        }, timeout);

        return new Promise<Protocol.ServerStateChange>(resolve => {
            let result: Thenable<Protocol.Status>;
            this.connection.onNotification(Messages.Client.ServerStateChangedNotification.type, state => {
                if (state.server.id === launchParameters.params.id && state.state === ServerStatus.STARTED) {
                    result.then(() => {
                        clearTimeout(timer);
                        resolve(state);
                    });
                }
            });
            result = this.connection.sendRequest(Messages.Server.StartServerAsyncRequest.type, launchParameters);
        });
    }

    /**
     * Sends a request to stop the given server. Subscribe to the 'serverStateChanged' event
     * to monitor the server's state changes
     * @param stopParameters server stopping parameters, set force to 'true' to force shutdown, see {@link Protocol.StopServerAttributes}
     * @param timeout timeout in milliseconds
     */
    async stopServerAsync(stopParameters: Protocol.StopServerAttributes, timeout: number = 2000): Promise<Protocol.Status> {
        return Common.sendSimpleRequest(this.connection, Messages.Server.StopServerAsyncRequest.type, stopParameters,
            timeout, ErrorMessages.STOPSERVER_TIMEOUT);
    }

    /**
     * Sends a request to stop the given server and waits for 'serverStateChanged' event
     * until the server's state has changed to 'stopped'
     * @param stopParameters server stopping parameters, set force to 'true' to force shutdown, see {@link Protocol.StopServerAttributes}
     * @param timeout timeout in milliseconds
     */
    stopServerSync(stopParameters: Protocol.StopServerAttributes, timeout: number = 60000): Promise<Protocol.ServerStateChange> {
        const timer = setTimeout(() => {
            return Promise.reject(`Failed to stop server ${stopParameters.id} in time`);
        }, timeout);

        return new Promise<Protocol.ServerStateChange>(resolve => {
            let result: Thenable<Protocol.Status>;
            this.connection.onNotification(Messages.Client.ServerStateChangedNotification.type, state => {
                if (state.server.id === stopParameters.id && state.state === ServerStatus.STOPPED) {
                    result.then(() => {
                        clearTimeout(timer);
                        resolve(state);
                    });
                }
            });
            result = this.connection.sendRequest(Messages.Server.StopServerAsyncRequest.type, stopParameters);
        });
    }
}