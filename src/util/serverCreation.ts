import { MessageConnection } from 'vscode-jsonrpc';
import { Protocol } from '../protocol/generated/protocol';
import { Messages } from '../protocol/generated/messages';
import { EventEmitter } from 'events';
import { Common } from './common';
import { ErrorMessages } from '../protocol/generated/outgoing';

/**
 * Server creation utility
 */
export class ServerCreation {

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
    }

    /**
     * Sends a request to create a server from a given directory, subscribe to the 'serverAdded'
     * event to see when the server creation is finished
     * @param path path to the server's root directory
     * @param id unique identifier for the newly created server
     * @param attributes optional extra server attributes
     * @param timeout timeout in milliseconds
     */
    async createServerFromPathAsync(path: string, id: string, attributes?: { [index: string]: any }, timeout: number = Common.DEFAULT_TIMEOUT)
        : Promise<Protocol.CreateServerResponse> {
        const serverBeans = await Common.sendSimpleRequest(this.connection, Messages.Server.FindServerBeansRequest.type,
            {filepath: path}, timeout / 2, ErrorMessages.FINDSERVERBEANS_TIMEOUT);
        const atts = Object.assign({}, attributes);
        atts['server.home.dir'] = serverBeans[0].location;
        if ((serverBeans[0].typeCategory === 'MINISHIFT') || (serverBeans[0].typeCategory === 'CDK')) {
            atts['server.home.file'] = serverBeans[0].location;
        }
        const serverAttributes: Protocol.ServerAttributes = {
            id: id,
            serverType: serverBeans[0].serverAdapterTypeId,
            attributes: atts
        };
        return Common.sendSimpleRequest(this.connection, Messages.Server.CreateServerRequest.type, serverAttributes,
            timeout, ErrorMessages.CREATESERVER_TIMEOUT);
    }

    /**
     * Sends a request to create a server from an existing ServerBean object, subscribe to the 'serverAdded'
     * event to see when the server creation is finished
     * @param serverBean ServerBean object
     * @param id unique identifier for the new server, if left empty, the serverBean.name will be used
     * @param attributes optional extra server attributes
     * @param timeout timeout in milliseconds
     */
    async createServerFromBeanAsync(serverBean: Protocol.ServerBean, id?: string, attributes?: { [index: string]: any }, timeout: number = Common.DEFAULT_TIMEOUT)
        : Promise<Protocol.CreateServerResponse> {
        const serverId = id ? id : serverBean.name;
        const atts = Object.assign({}, attributes);
        atts['server.home.dir'] = serverBean.location;
        if ((serverBean.typeCategory === 'MINISHIFT') || (serverBean.typeCategory === 'CDK')) {
            atts['server.home.file'] = serverBean.location;
        }
        const serverAttributes: Protocol.ServerAttributes = {
            id: serverId,
            serverType: serverBean.serverAdapterTypeId,
            attributes: atts
        };
        return Common.sendSimpleRequest(this.connection, Messages.Server.CreateServerRequest.type, serverAttributes,
            timeout, ErrorMessages.CREATESERVER_TIMEOUT);
    }

    /**
     * Sends a request to create a server from a given directory, then waits for the 'serverAdded'
     * event with the given id
     * @param path path to the server's root directory
     * @param id unique identifier for the newly created server
     * @param attributes optional extra server attributes
     * @param timeout timeout in milliseconds
     */
    createServerFromPath(path: string, id: string, attributes?: { [index: string]: any }, timeout: number = Common.DEFAULT_TIMEOUT)
        : Promise<Protocol.ServerHandle> {
        return new Promise<Protocol.ServerHandle>(async (resolve, reject) => {
            const timer = setTimeout(() => {
                return reject(new Error(ErrorMessages.CREATESERVER_TIMEOUT));
            }, timeout);

            let result: Thenable<Protocol.CreateServerResponse>;
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
            const atts = Object.assign({}, attributes);
            atts['server.home.dir'] = serverBeans[0].location;
            if ((serverBeans[0].typeCategory === 'MINISHIFT') || (serverBeans[0].typeCategory === 'CDK')) {
                atts['server.home.file'] = serverBeans[0].location;
            }
            const serverAttributes: Protocol.ServerAttributes = {
                id: id,
                serverType: serverBeans[0].serverAdapterTypeId,
                attributes: atts
            };
            result = this.connection.sendRequest(Messages.Server.CreateServerRequest.type, serverAttributes);
        });
    }

    /**
     * Sends a request to create a server from an existing ServerBean object,  then waits for the 'serverAdded'
     * event with the given id
     * @param serverBean ServerBean object
     * @param id unique identifier for the new server, if left empty, the serverBean.name will be used
     * @param attributes optional extra server attributes
     * @param timeout timeout in milliseconds
     */
    createServerFromBean(serverBean: Protocol.ServerBean, id?: string, attributes?: { [index: string]: any }, timeout: number = Common.DEFAULT_TIMEOUT)
        : Promise<Protocol.ServerHandle> {
        return new Promise<Protocol.ServerHandle>(async (resolve, reject) => {
            const serverId = id ? id : serverBean.name;
            const timer = setTimeout(() => {
                return reject(new Error(ErrorMessages.CREATESERVER_TIMEOUT));
            }, timeout);

            let result: Thenable<Protocol.CreateServerResponse>;
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

            const atts = Object.assign({}, attributes);
            atts['server.home.dir'] = serverBean.location;
            if ((serverBean.typeCategory === 'MINISHIFT') || (serverBean.typeCategory === 'CDK')) {
                atts['server.home.file'] = serverBean.location;
            }
            const serverAttributes: Protocol.ServerAttributes = {
                id: serverId,
                serverType: serverBean.serverAdapterTypeId,
                attributes: atts
            };
            if ((serverBean.typeCategory === 'MINISHIFT') || (serverBean.typeCategory === 'CDK')) {
                serverAttributes.attributes['server.home.file'] = serverBean.location;
            }
            result = this.connection.sendRequest(Messages.Server.CreateServerRequest.type, serverAttributes);
        });
    }

}
