import { MessageConnection } from 'vscode-jsonrpc';
import { Protocol } from '../protocol/protocol';
import { Messages } from '../protocol/messages';
import { EventEmitter } from 'events';
import { Common, ErrorMessages } from './common';

/**
 * Server creation/removal handler
 */
export class ServerModel {

    private connection: MessageConnection;
    private emitter: EventEmitter;

    /**
     * Constructs a new server model handler
     * @param connection message connection to the RSP
     * @param emitter event emitter to handle notification events
     */
    constructor(connection: MessageConnection, emitter: EventEmitter) {
        this.connection = connection;
        this.emitter = emitter;
        this.listenToServerChanges();
    }

    /**
     * Subscribe to server creation and deletion events
     */
    private listenToServerChanges() {
        this.connection.onNotification(Messages.Client.ServerAddedNotification.type, handle => {
            this.emitter.emit('serverAdded', handle);
        });

        this.connection.onNotification(Messages.Client.ServerRemovedNotification.type, handle => {
            this.emitter.emit('serverRemoved', handle);
        });
    }

    /**
     * Sends a request to create a server from a given directory, subscribe to the 'serverAdded'
     * event to see when the server creation is finished
     * @param path path to the server's root directory
     * @param id unique identifier for the newly created server
     * @param timeout timeout in milliseconds
     */
    async createServerFromPathAsync(path: string, id: string, timeout: number = 2000): Promise<Protocol.Status> {
        const serverBeans = await Common.sendSimpleRequest(this.connection, Messages.Server.FindServerBeansRequest.type,
            {filepath: path}, timeout / 2, ErrorMessages.FINDBEANS_TIMEOUT);
        const serverAttributes: Protocol.ServerAttributes = {
            id: id,
            serverType: serverBeans[0].serverAdapterTypeId,
            attributes: {
                'server.home.dir': serverBeans[0].location
            }
        };
        if (serverBeans[0].typeCategory === 'MINISHIFT') {
            serverAttributes.attributes['server.home.file'] = serverBeans[0].location;
        }
        return Common.sendSimpleRequest(this.connection, Messages.Server.CreateServerRequest.type, serverAttributes,
            timeout, ErrorMessages.CREATESERVER_TIMEOUT);
    }

    /**
     * Sends a request to create a server from an existing ServerBean object, subscribe to the 'serverAdded'
     * event to see when the server creation is finished
     * @param serverBean ServerBean object
     * @param id unique identifier for the new server, if left empty, the serverBean.name will be used
     * @param timeout timeout in milliseconds
     */
    async createServerFromBeanAsync(serverBean: Protocol.ServerBean, id?: string, timeout: number = 2000): Promise<Protocol.Status> {
        const serverId = id ? id : serverBean.name;
        const serverAttributes: Protocol.ServerAttributes = {
            id: serverId,
            serverType: serverBean.serverAdapterTypeId,
            attributes: {
                'server.home.dir': serverBean.location
            }
        };
        if (serverBean.typeCategory === 'MINISHIFT') {
            serverAttributes.attributes['server.home.file'] = serverBean.location;
        }
        return Common.sendSimpleRequest(this.connection, Messages.Server.CreateServerRequest.type, serverAttributes,
            timeout, ErrorMessages.CREATESERVER_TIMEOUT);
    }

    /**
     * Sends a request to create a server from a given directory, then waits for the 'serverAdded'
     * event with the given id
     * @param path path to the server's root directory
     * @param id unique identifier for the newly created server
     * @param timeout timeout in milliseconds
     */
    createServerFromPath(path: string, id: string, timeout: number = 2000): Promise<Protocol.ServerHandle> {
        return new Promise<Protocol.ServerHandle>(async (resolve, reject) => {
            const timer = setTimeout(() => {
                return reject(new Error(ErrorMessages.CREATESERVER_TIMEOUT));
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
            this.emitter.prependListener('serverAdded', listener);

            const serverBeans = await this.connection.sendRequest(Messages.Server.FindServerBeansRequest.type, {filepath: path});
            const serverAttributes: Protocol.ServerAttributes = {
                id: id,
                serverType: serverBeans[0].serverAdapterTypeId,
                attributes: {
                    'server.home.dir': serverBeans[0].location
                }
            };
            if (serverBeans[0].typeCategory === 'MINISHIFT') {
                serverAttributes.attributes['server.home.file'] = serverBeans[0].location;
            }

            result = this.connection.sendRequest(Messages.Server.CreateServerRequest.type, serverAttributes);
        });
    }

    /**
     * Sends a request to create a server from an existing ServerBean object,  then waits for the 'serverAdded'
     * event with the given id
     * @param serverBean ServerBean object
     * @param id unique identifier for the new server, if left empty, the serverBean.name will be used
     * @param timeout timeout in milliseconds
     */
    createServerFromBean(serverBean: Protocol.ServerBean, id?: string, timeout: number = 2000): Promise<Protocol.ServerHandle> {
        return new Promise<Protocol.ServerHandle>(async (resolve, reject) => {
            const serverId = id ? id : serverBean.name;
            const timer = setTimeout(() => {
                return reject(new Error(ErrorMessages.CREATESERVER_TIMEOUT));
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
            this.emitter.prependListener('serverAdded', listener);

            const serverAttributes: Protocol.ServerAttributes = {
                id: serverId,
                serverType: serverBean.serverAdapterTypeId,
                attributes: {
                    'server.home.dir': serverBean.location
                }
            };
            if (serverBean.typeCategory === 'MINISHIFT') {
                serverAttributes.attributes['server.home.file'] = serverBean.location;
            }
            result = this.connection.sendRequest(Messages.Server.CreateServerRequest.type, serverAttributes);
        });
    }

    /**
     * Sends notification to remove a server from RSP, then waits for the appropriate 'serverRemoved' event
     * @param serverHandle server handle containing the server id and type, see {@link Protocol.ServerHandle}
     * @param timeout timeout in milliseconds
     */
    deleteServerSync(serverHandle: Protocol.ServerHandle, timeout: number = 2000): Promise<Protocol.ServerHandle> {
        const listener = (param: Protocol.ServerHandle) => {
            return param.id === serverHandle.id;
        };
        return Common.sendRequestSync(this.connection, Messages.Server.DeleteServerRequest.type, serverHandle, this.emitter,
            'serverRemoved', listener, timeout, ErrorMessages.DELETESERVER_TIMEOUT);
    }

    /**
     * Sends notification to remove a server from RSP. Subscribe to the 'serverRemoved' event to see
     * when the removal finishes
     * @param serverHandle server handle containing the server id and type, see {@link Protocol.ServerHandle}
     */
    deleteServerAsync(serverHandle: Protocol.ServerHandle, timeout: number = 2000): Promise<Protocol.Status> {
        return Common.sendSimpleRequest(this.connection, Messages.Server.DeleteServerRequest.type, serverHandle, timeout,
             ErrorMessages.DELETESERVER_TIMEOUT);
    }

    /**
     * Retreives handles for all servers within RSP
     * @param timeout timeout in milliseconds
     */
    getServerHandles(timeout: number = 2000): Promise<Protocol.ServerHandle[]> {
        return Common.sendSimpleRequest(this.connection, Messages.Server.GetServerHandlesRequest.type, null,
             timeout, ErrorMessages.GETSERVERS_TIMEOUT);
    }

    /**
     * Retreives all supported server types
     * @param timeout timeout in milliseconds
     */
    getServerTypes(timeout: number = 2000): Promise<Protocol.ServerType[]> {
        return Common.sendSimpleRequest(this.connection, Messages.Server.GetServerTypesRequest.type, null,
             timeout, ErrorMessages.GETSERVERTYPES_TIMEOUT);
    }

    /**
     * Retreives required attributes for a given server type
     * @param serverType object representing the server type, see {@link Protocol.ServerType}
     * @param timeout timeout in milliseconds
     */
    getServerTypeRequiredAttributes(serverType: Protocol.ServerType, timeout: number = 2000): Promise<Protocol.Attributes> {
        return Common.sendSimpleRequest(this.connection, Messages.Server.GetRequiredAttributesRequest.type, serverType,
             timeout, ErrorMessages.GETREQUIREDATTRS_TIMEOUT);
    }

    /**
     * Retreives optional attributes for a given server type
     * @param serverType object representing the server type, see {@link Protocol.ServerType}
     * @param timeout timeout in milliseconds
     */
    getServerTypeOptionalAttributes(serverType: Protocol.ServerType, timeout: number = 2000): Promise<Protocol.Attributes> {
        return Common.sendSimpleRequest(this.connection, Messages.Server.GetOptionalAttributesRequest.type, serverType,
            timeout, ErrorMessages.GETOPTIONALATTRS_TIMEOUT);
    }
}