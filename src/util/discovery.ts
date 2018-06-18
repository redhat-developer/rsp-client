import Protocol from '../protocol/protocol';
import { Messages } from '../protocol/messages';
import { Common, ErrorMessages } from './common';
import { MessageConnection } from 'vscode-jsonrpc';
import { EventEmitter } from 'events';

export class Discovery {

    private connection: MessageConnection;
    private emitter: EventEmitter;

    constructor(connection: MessageConnection, emitter: EventEmitter) {
        this.connection = connection;
        this.emitter = emitter;
        this.listenToDiscoveryChanges();
    }

    private listenToDiscoveryChanges() {
        this.connection.onNotification(Messages.Client.DiscoveryPathAddedNotification.type, discoveryPath => {
           this.emitter.emit('discoveryPathAdded', discoveryPath);
        });

        this.connection.onNotification(Messages.Client.DiscoveryPathRemovedNotification.type, discoveryPath => {
            this.emitter.emit('discoveryPathRemoved', discoveryPath);
        });
    }

    findServerBeans(path: string, timeout: number = 2000): Promise<Protocol.ServerBean[]> {
        return Common.sendSimpleRequest(this.connection, Messages.Server.FindServerBeansRequest.type,
             {filepath: path}, timeout, ErrorMessages.FINDBEANS_TIMEOUT);
    }

    addDiscoveryPathAsync(path: string, timeout: number = 2000): void {
        this.connection.sendNotification(Messages.Server.AddDiscoveryPathNotification.type, { filepath: path});
    }

    addDiscoveryPathSync(path: string, timeout: number = 2000): Promise<Protocol.DiscoveryPath> {
        const discoveryPath = { filepath: path };
        return Common.sendNotificationSync(this.connection, Messages.Server.AddDiscoveryPathNotification.type,
             discoveryPath, this.emitter, 'discoveryPathAdded', timeout, ErrorMessages.ADDPATH_TIMEOUT);
    }

    removeDiscoveryPathSync(path: string | Protocol.DiscoveryPath, timeout: number = 2000): Promise<Protocol.DiscoveryPath> {
        if (typeof(path) === 'string') {
            path = { filepath: path };
        }

        return Common.sendNotificationSync(this.connection, Messages.Server.RemoveDiscoveryPathNotification.type,
            path, this.emitter, 'discoveryPathRemoved', timeout, ErrorMessages.REMOVEPATH_TIMEOUT);
    }

    removeDiscoveryPathAsync(path: string | Protocol.DiscoveryPath, timeout: number = 2000): void {
        if (typeof(path) === 'string') {
            path = { filepath: path };
        }
        this.connection.sendNotification(Messages.Server.RemoveDiscoveryPathNotification.type, path);
    }

    getDiscoveryPaths(timeout: number = 2000): Promise<Protocol.DiscoveryPath[]> {
        return Common.sendSimpleRequest(this.connection, Messages.Server.GetDiscoveryPathsRequest.type,
             null, timeout, ErrorMessages.GETPATHS_TIMEOUT);
    }
}