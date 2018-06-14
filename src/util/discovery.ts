import Protocol from '../protocol/protocol';
import Messages from '../protocol/messages';
import {MessageConnection} from 'vscode-jsonrpc';

class Discovery {

    private connection: MessageConnection;

    constructor(connection: MessageConnection) {
        this.connection = connection;
    }
    
    async findServerBeans(path: string, timeout: number = 2000): Promise<Protocol.ServerBean[]> {
        let timer = setTimeout(() => {
            return Promise.reject(`Failed to retrieve server beans in time`);
        }, timeout);

        return this.connection.sendRequest(Messages.Server.FindServerBeansRequest.type, {filepath: path}).then((beans) => {
            clearTimeout(timer);
            return Promise.resolve(beans);
        });
    }

    async addDiscoveryPath(path: string, timeout: number = 2000): Promise<Protocol.DiscoveryPath> {
        let timer = setTimeout(() => {
            return Promise.reject(`Failed to add discovery path in time`);
        }, timeout);

        return new Promise<Protocol.DiscoveryPath>((resolve) => {
            this.connection.onNotification(Messages.Client.DiscoveryPathAddedNotification.type, discoveryPath => {
                if (discoveryPath.filepath === path) {
                    clearTimeout(timer);
                    resolve(discoveryPath);
                }
            });
            this.connection.sendNotification(Messages.Server.AddDiscoveryPathNotification.type, { filepath: path });
        });
    }

    async removeDiscoveryPath(path: string | Protocol.DiscoveryPath, timeout: number = 2000): Promise<Protocol.DiscoveryPath> {
        let timer = setTimeout(() => {
            return Promise.reject(`Failed to remove discovery path in time`);
        }, timeout);
        if (typeof(path) !== 'string') {
            path = path.filepath;
        }

        return new Promise<Protocol.DiscoveryPath>((resolve) => {
            this.connection.onNotification(Messages.Client.DiscoveryPathRemovedNotification.type, discoveryPath => {
                if (discoveryPath.filepath === path) {
                    clearTimeout(timer);
                    resolve(discoveryPath);
                }
            });
            this.connection.sendNotification(Messages.Server.RemoveDiscoveryPathNotification.type, { filepath: path });
        });
    }

    async getDiscoveryPaths(timeout: number = 2000): Promise<Protocol.DiscoveryPath[]> {
        let timer = setTimeout(() => {
            return Promise.reject(`Failed to retrieve discovery paths in time`);
        }, timeout);

        return this.connection.sendRequest(Messages.Server.GetDiscoveryPathsRequest.type).then((paths) => {
            clearTimeout(timer);
            return Promise.resolve(paths);
        });
    }    
}

export default Discovery;