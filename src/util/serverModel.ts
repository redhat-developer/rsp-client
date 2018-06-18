import { MessageConnection } from 'vscode-jsonrpc';
import Protocol from '../protocol/protocol';
import { Messages } from '../protocol/messages';
import { EventEmitter } from 'events';
import { Common, ErrorMessages } from './common';

export class ServerModel {

    private connection: MessageConnection;
    private emitter: EventEmitter;

    constructor(connection: MessageConnection, emitter: EventEmitter) {
        this.connection = connection;
        this.emitter = emitter;
        this.listenToServerChanges();
    }

    private listenToServerChanges() {
        this.connection.onNotification(Messages.Client.ServerAddedNotification.type, handle => {
            this.emitter.emit('serverAdded', handle);
        });

        this.connection.onNotification(Messages.Client.ServerRemovedNotification.type, handle => {
            this.emitter.emit('serverRemoved', handle);
        });
    }

    async createServerFromPathAsync(path: string, id: string, timeout: number = 2000): Promise<Protocol.Status> {
        const serverBeans = await this.connection.sendRequest(Messages.Server.FindServerBeansRequest.type, {filepath: path});
        const serverAttributes = {
            id: id,
            serverType: serverBeans[0].serverAdapterTypeId,
            attributes: {
                'server.home.dir': serverBeans[0].location
            }
        };
        return this.connection.sendRequest(Messages.Server.CreateServerRequest.type, serverAttributes);
    }

    async createServerFromBeanAsync(serverBean: Protocol.ServerBean, id?: string, timeout: number = 2000): Promise<Protocol.Status> {
        const serverId = id ? id : serverBean.name;
        const serverAttributes = {
            id: serverId,
            serverType: serverBean.serverAdapterTypeId,
            attributes: {
                'server.home.dir': serverBean.location
            }
        };
        return this.connection.sendRequest(Messages.Server.CreateServerRequest.type, serverAttributes);
    }

    createServerFromPath(path: string, id: string, timeout: number = 2000): Promise<Protocol.ServerHandle> {
        return new Promise<Protocol.ServerHandle>(async (resolve, reject) => {
            const timer = setTimeout(() => {
                reject(`Failed to create server ${id} in time`);
            }, timeout);

            let result: Thenable<Protocol.Status>;
            const listener = (handle: Protocol.ServerHandle) => {
                if (handle.id === id) {
                    result.then(status => {
                        clearTimeout(timer);
                        this.emitter.removeListener('serverAdded', listener);
                        resolve(handle);
                    });
                }
            };
            this.emitter.on('serverAdded', listener);

            const serverBeans = await this.connection.sendRequest(Messages.Server.FindServerBeansRequest.type, {filepath: path});
            const serverAttributes = {
                id: id,
                serverType: serverBeans[0].serverAdapterTypeId,
                attributes: {
                    'server.home.dir': serverBeans[0].location
                }
            };

            result = this.connection.sendRequest(Messages.Server.CreateServerRequest.type, serverAttributes);
        });
    }

    createServerFromBean(serverBean: Protocol.ServerBean, id?: string, timeout: number = 2000): Promise<Protocol.ServerHandle> {
        return new Promise<Protocol.ServerHandle>(async (resolve, reject) => {
            const serverId = id ? id : serverBean.name;
            const timer = setTimeout(() => {
                reject(`Failed to create server ${serverId} in time`);
            }, timeout);

            let result: Thenable<Protocol.Status>;
            const listener = (handle: Protocol.ServerHandle) => {
                if (handle.id === serverId) {
                    result.then(status => {
                        clearTimeout(timer);
                        this.emitter.removeListener('serverAdded', listener);
                        resolve(handle);
                    });
                }
            };
            this.emitter.on('serverAdded', listener);

            const serverAttributes = {
                id: serverId,
                serverType: serverBean.serverAdapterTypeId,
                attributes: {
                    'server.home.dir': serverBean.location
                }
            };
            result = this.connection.sendRequest(Messages.Server.CreateServerRequest.type, serverAttributes);
        });
    }

    deleteServerSync(serverHandle: Protocol.ServerHandle, timeout: number = 2000): Promise<Protocol.ServerHandle> {
        return Common.sendNotificationSync(this.connection, Messages.Server.DeleteServerNotification.type, serverHandle,
             this.emitter, 'serverRemoved', timeout, ErrorMessages.DELETESERVERSYNC_TIMEOUT);
    }

    deleteServerAsync(serverHandle: Protocol.ServerHandle, timeout: number = 2000): void {
        this.connection.sendNotification(Messages.Server.DeleteServerNotification.type, serverHandle);
    }

    getServerHandles(timeout: number = 2000): Promise<Protocol.ServerHandle[]> {
        return Common.sendSimpleRequest(this.connection, Messages.Server.GetServerHandlesRequest.type, null,
             timeout, ErrorMessages.GETSERVERS_TIMEOUT);
    }

    getServerTypeRequiredAttributes(serverType: Protocol.ServerType, timeout: number = 2000): Promise<Protocol.Attributes> {
        return Common.sendSimpleRequest(this.connection, Messages.Server.GetRequiredAttributesRequest.type, serverType,
             timeout, ErrorMessages.GETREQUIREDATTRS_TIMEOUT);
    }

    getServerTypeOptionalAttributes(serverType: Protocol.ServerType, timeout: number = 2000): Promise<Protocol.Attributes> {
        return Common.sendSimpleRequest(this.connection, Messages.Server.GetOptionalAttributesRequest.type, serverType,
            timeout, ErrorMessages.GETOPTIONALATTRS_TIMEOUT);
    }
}