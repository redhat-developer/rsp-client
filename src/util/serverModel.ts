import { MessageConnection } from "vscode-jsonrpc";
import Protocol from '../protocol/protocol';
import Messages from '../protocol/messages';

class ServerModel {

    private connection: MessageConnection;

    constructor(connection: MessageConnection) {
        this.connection = connection;
    }
    
    createServerFromPath(path: string, id: string, timeout: number = 2000): Promise<Protocol.ServerHandle> {
        return new Promise<Protocol.ServerHandle>(async (resolve, reject) => {
            let timer = setTimeout(() => {
                reject(`Failed to create server ${id} in time`);
            }, timeout);

            let result: Thenable<Protocol.Status>;
            this.connection.onNotification(Messages.Client.ServerAddedNotification.type, handle => {
                if (handle.id === id) {
                    result.then((status) => {
                        clearTimeout(timer);
                        resolve(handle);
                    });
                }
            });

            const serverBeans = await this.connection.sendRequest(Messages.Server.FindServerBeansRequest.type, {filepath: path});
            const serverAttributes = {
                id: id,
                serverType: serverBeans[0].serverAdapterTypeId,
                attributes: {
                    'server.home.dir': serverBeans[0].location,
                }
            };

            result = this.connection.sendRequest(Messages.Server.CreateServerRequest.type, serverAttributes);
        });
    }

    createServerFromBean(serverBean: Protocol.ServerBean, id?: string, timeout: number = 2000): Promise<Protocol.ServerHandle> {
        return new Promise<Protocol.ServerHandle>(async (resolve, reject) => {
            const serverId = id ? id : serverBean.name
            let timer = setTimeout(() => {
                reject(`Failed to create server ${serverId} in time`);
            }, timeout);

            let result: Thenable<Protocol.Status>;
            this.connection.onNotification(Messages.Client.ServerAddedNotification.type, handle => {
                if (handle.id === serverId) {
                    result.then((status) => {
                        clearTimeout(timer);
                        resolve(handle);
                    });
                }
            });

            const serverAttributes = {
                id: serverId,
                serverType: serverBean.serverAdapterTypeId,
                attributes: {
                    'server.home.dir': serverBean.location,
                }
            };
            result = this.connection.sendRequest(Messages.Server.CreateServerRequest.type, serverAttributes);
        });
    }

    async deleteServer(serverHandle: Protocol.ServerHandle, timeout: number = 2000): Promise<Protocol.ServerHandle> {
        return new Promise<Protocol.ServerHandle>((resolve, reject) => {
            let timer = setTimeout(() => {
                reject(`Failed to delete server ${serverHandle.id} in time`);
            }, timeout);

            this.connection.onNotification(Messages.Client.ServerRemovedNotification.type, handle => {
                if (handle.id === serverHandle.id) {
                    clearTimeout(timer);
                    resolve(handle);
                }
            });
            this.connection.sendNotification(Messages.Server.DeleteServerNotification.type, serverHandle);
        });
    }

    async getServerHandles(timeout: number = 2000): Promise<Protocol.ServerHandle[]> {
        let timer = setTimeout(() => {
            return Promise.reject(`Failed to retrieve servers in time`);
        }, timeout);
        
        return this.connection.sendRequest(Messages.Server.GetServerHandlesRequest.type).then((handles) => {
            clearTimeout(timer);
            return Promise.resolve(handles);
        });
    }

    async getServerTypeRequiredAttributes(serverType: Protocol.ServerType, timeout: number = 2000): Promise<Protocol.Attributes> {
        let timer = setTimeout(() => {
            return Promise.reject(`Failed to retrieve servers in time`);
        }, timeout);

        return this.connection.sendRequest(Messages.Server.GetRequiredAttributesRequest.type, serverType).then((attr) => {
            clearTimeout(timer);
            return Promise.resolve(attr);
        });
    }

    async getServerTypeOptionalAttributes(serverType: Protocol.ServerType, timeout: number = 2000): Promise<Protocol.Attributes> {
        let timer = setTimeout(() => {
            return Promise.reject(`Failed to retrieve servers in time`);
        }, timeout);

        return this.connection.sendRequest(Messages.Server.GetOptionalAttributesRequest.type, serverType).then((attr) => {
            clearTimeout(timer);
            return Promise.resolve(attr);
        });
    }
}

export default ServerModel;