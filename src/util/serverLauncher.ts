import { MessageConnection } from "vscode-jsonrpc";
import Protocol from '../protocol/protocol';
import Messages from '../protocol/messages';
import ServerStatus from '../protocol/serverState';
import { clearTimeout } from "timers";
import { EventEmitter } from 'events';

export class Launcher {

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

    async getLaunchModes(serverType: Protocol.ServerType, timeout: number = 2000): Promise<Protocol.ServerLaunchMode[]> {
        let timer = setTimeout(() => {
            return Promise.reject(`Failed to get launch modes for ${serverType} in time`);
        }, timeout);

        return this.connection.sendRequest(Messages.Server.GetLaunchModesRequest.type, serverType).then((modes) => {
            clearTimeout(timer);
            return Promise.resolve(modes);
        });
    }

    async getRequiredLaunchAttributes(launchAttrRequest: Protocol.LaunchAttributesRequest, timeout: number = 2000): Promise<Protocol.Attributes> {
        let timer = setTimeout(() => {
            return Promise.reject(`Failed to get required launch attributes for ${launchAttrRequest.id} in time`);
        }, timeout);

        return this.connection.sendRequest(Messages.Server.GetRequiredLaunchAttributesRequest.type, launchAttrRequest).then((attr) => {
            clearTimeout(timer);
            return Promise.resolve(attr);
        });
    }

    async getOptionalLaunchAttributes(launchAttrRequest: Protocol.LaunchAttributesRequest, timeout: number = 2000): Promise<Protocol.Attributes> {
        let timer = setTimeout(() => {
            return Promise.reject(`Failed to get optional launch attributes ${launchAttrRequest.id} in time`);
        }, timeout);

        return this.connection.sendRequest(Messages.Server.GetOptionalLaunchAttributesRequest.type, launchAttrRequest).then((attr) => {
            clearTimeout(timer);
            return Promise.resolve(attr);
        });
    }

    async getLaunchCommand(launchParameters: Protocol.LaunchParameters, timeout: number = 2000): Promise<Protocol.CommandLineDetails> {
        let timer = setTimeout(() => {
            return Promise.reject(`Failed to get launch command for ${launchParameters.params.id} in time`);
        }, timeout);

        return this.connection.sendRequest(Messages.Server.GetLaunchCommandRequest.type, launchParameters).then((command) => {
            clearTimeout(timer);
            return Promise.resolve(command);
        });
    }

    async serverStartingByClient(startingAttributes: Protocol.ServerStartingAttributes, timeout: number = 2000): Promise<Protocol.Status> {
        let timer = setTimeout(() => {
            return Promise.reject(`Failed to notify of server ${startingAttributes.request.params.id} being started in time`);
        }, timeout);

        return this.connection.sendRequest(Messages.Server.ServerStartingByClientRequest.type, startingAttributes).then((status) => {
            clearTimeout(timer);
            return Promise.resolve(status);
        });
    }

    async serverStartedByClient(launchParameters: Protocol.LaunchParameters, timeout: number = 2000): Promise<Protocol.Status> {
        let timer = setTimeout(() => {
            return Promise.reject(`Failed to notify of server ${launchParameters.params.id} started in time`);
        }, timeout);

        return this.connection.sendRequest(Messages.Server.ServerStartedByClientRequest.type, launchParameters).then((status) => {
            clearTimeout(timer);
            return Promise.resolve(status);
        });
    }

    async startServerAsync(launchParameters: Protocol.LaunchParameters, timeout: number = 2000): Promise<Protocol.Status> {
        let timer = setTimeout(() => {
            return Promise.reject(`Failed to start server ${launchParameters.params.id} in time`);
        }, timeout);

        return this.connection.sendRequest(Messages.Server.StartServerAsyncRequest.type, launchParameters).then((status) => {
            clearTimeout(timer);
            return Promise.resolve(status);
        });
    }

    startServerSync(launchParameters: Protocol.LaunchParameters, timeout: number = 60000): Promise<Protocol.ServerStateChange> {
        let timer = setTimeout(() => {
            return Promise.reject(`Failed to send server start request from ${launchParameters.params.id} in time`);
        }, timeout);

        return new Promise<Protocol.ServerStateChange>((resolve) => {
            let result: Thenable<Protocol.Status>;
            this.connection.onNotification(Messages.Client.ServerStateChangedNotification.type, (state) => {
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
        let timer = setTimeout(() => {
            return Promise.reject(`Failed to send server stop request from ${stopParameters.id} in time`);
        }, timeout);

        return this.connection.sendRequest(Messages.Server.StopServerAsyncRequest.type, stopParameters).then((status) => {
            clearTimeout(timer);
            return Promise.resolve(status);
        });
    }

    stopServerSync(stopParameters: Protocol.StopServerAttributes, timeout: number = 60000): Promise<Protocol.ServerStateChange> {
        let timer = setTimeout(() => {
            return Promise.reject(`Failed to stop server ${stopParameters.id} in time`);
        }, timeout);

        return new Promise<Protocol.ServerStateChange>((resolve) => {
            let result: Thenable<Protocol.Status>;
            this.connection.onNotification(Messages.Client.ServerStateChangedNotification.type, (state) => {
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

export default Launcher;