import { MessageConnection } from 'vscode-jsonrpc';
import Protocol from '../protocol/protocol';
import { Messages } from '../protocol/messages';
import { ServerStatus } from '../protocol/serverState';
import { EventEmitter } from 'events';
import { Common, ErrorMessages } from './common';

export class ServerLauncher {

    private connection: MessageConnection;
    private emitter: EventEmitter;

    constructor(connection: MessageConnection, emitter: EventEmitter) {
        this.connection = connection;
        this.emitter = emitter;
        this.listenToServerChanges();
    }

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

    getLaunchModes(serverType: Protocol.ServerType, timeout: number = 2000): Promise<Protocol.ServerLaunchMode[]> {
        return Common.sendSimpleRequest(this.connection, Messages.Server.GetLaunchModesRequest.type, serverType,
             timeout, ErrorMessages.GETLAUNCHMODES_TIMEOUT);
    }

    getRequiredLaunchAttributes(launchAttrRequest: Protocol.LaunchAttributesRequest, timeout: number = 2000): Promise<Protocol.Attributes> {
        return Common.sendSimpleRequest(this.connection, Messages.Server.GetRequiredLaunchAttributesRequest.type, launchAttrRequest,
            timeout, ErrorMessages.GETREQUIREDLAUNCHATTRS_TIMEOUT);
    }

    getOptionalLaunchAttributes(launchAttrRequest: Protocol.LaunchAttributesRequest, timeout: number = 2000): Promise<Protocol.Attributes> {
        return Common.sendSimpleRequest(this.connection, Messages.Server.GetOptionalLaunchAttributesRequest.type, launchAttrRequest,
            timeout, ErrorMessages.GETOPTIONALLAUNCHATTRS_TIMEOUT);
    }

    getLaunchCommand(launchParameters: Protocol.LaunchParameters, timeout: number = 2000): Promise<Protocol.CommandLineDetails> {
        return Common.sendSimpleRequest(this.connection, Messages.Server.GetLaunchCommandRequest.type, launchParameters,
            timeout, ErrorMessages.GETLAUNCHCOMMAND_TIMEOUT);
    }

    serverStartingByClient(startingAttributes: Protocol.ServerStartingAttributes, timeout: number = 2000): Promise<Protocol.Status> {
        return Common.sendSimpleRequest(this.connection, Messages.Server.ServerStartingByClientRequest.type, startingAttributes,
            timeout, ErrorMessages.SERVERSTARTINGBYCLIENT_TIMEOUT);
    }

    serverStartedByClient(launchParameters: Protocol.LaunchParameters, timeout: number = 2000): Promise<Protocol.Status> {
        return Common.sendSimpleRequest(this.connection, Messages.Server.ServerStartedByClientRequest.type, launchParameters,
            timeout, ErrorMessages.SERVERSTARTEDBYCLIENT_TIMEOUT);
    }

    startServerAsync(launchParameters: Protocol.LaunchParameters, timeout: number = 2000): Promise<Protocol.Status> {
        return Common.sendSimpleRequest(this.connection, Messages.Server.StartServerAsyncRequest.type, launchParameters,
            timeout, ErrorMessages.STARTSERVER_TIMEOUT);
    }

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

    async stopServerAsync(stopParameters: Protocol.StopServerAttributes, timeout: number = 2000): Promise<Protocol.Status> {
        return Common.sendSimpleRequest(this.connection, Messages.Server.StopServerAsyncRequest.type, stopParameters,
            timeout, ErrorMessages.STOPSERVER_TIMEOUT);
    }

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