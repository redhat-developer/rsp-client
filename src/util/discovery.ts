import { Protocol } from '../protocol/protocol';
import { Messages } from '../protocol/messages';
import { Common, ErrorMessages } from './common';
import { MessageConnection } from 'vscode-jsonrpc';
import { EventEmitter } from 'events';

/**
 * Server discovery requests handler
 */
export class Discovery {

    private connection: MessageConnection;
    private emitter: EventEmitter;

    /**
     * Constructs a new discovery handler
     * @param connection message connection to the SSP
     * @param emitter event emitter to handle notification events
     */
    constructor(connection: MessageConnection, emitter: EventEmitter) {
        this.connection = connection;
        this.emitter = emitter;
        this.listenToDiscoveryChanges();
    }

    /**
     * Subscribes to notifications sent by the server
     */
    private listenToDiscoveryChanges() {
        this.connection.onNotification(Messages.Client.DiscoveryPathAddedNotification.type, discoveryPath => {
            this.emitter.emit('discoveryPathAdded', discoveryPath);
        });

        this.connection.onNotification(Messages.Client.DiscoveryPathRemovedNotification.type, discoveryPath => {
            this.emitter.emit('discoveryPathRemoved', discoveryPath);
        });
    }

    /**
     * Finds suitable servers in a directory
     * @param path path to the desired directory
     * @param timeout timeout in milliseconds
     */
    findServerBeans(path: string, timeout: number = 2000): Promise<Protocol.ServerBean[]> {
        return Common.sendSimpleRequest(this.connection, Messages.Server.FindServerBeansRequest.type,
             {filepath: path}, timeout, ErrorMessages.FINDBEANS_TIMEOUT);
    }

    /**
     * Sends notification to the SSP to add a directory to its discovery paths.
     * 'discoveryPathAdded' event will be fired when a response notification is received
     * @param path path to the desired directory
     */
    addDiscoveryPathAsync(path: string): void {
        Common.sendSimpleNotification(this.connection, Messages.Server.AddDiscoveryPathNotification.type, { filepath: path });
    }

    /**
     * Synchronously adds discovery path to SSP by sending a notification and then waiting for
     * 'discoveryPathAdded' event to be fired
     * @param path path to the desired directory
     * @param timeout timeout in milliseconds
     */
    addDiscoveryPathSync(path: string, timeout: number = 2000): Promise<Protocol.DiscoveryPath> {
        const discoveryPath = { filepath: path };
        return Common.sendNotificationSync(this.connection, Messages.Server.AddDiscoveryPathNotification.type,
             discoveryPath, this.emitter, 'discoveryPathAdded', timeout, ErrorMessages.ADDPATH_TIMEOUT);
    }

    /**
     * Sends notification to the SSP to remove a directory from its discovery paths.
     * 'discoveryPathRemoved' event will be fired when a response notification is received
     * @param path path to the desired directory or a DiscoveryPath object containing the given filepath
     */
    removeDiscoveryPathAsync(path: string | Protocol.DiscoveryPath): void {
        if (typeof(path) === 'string') {
            path = { filepath: path };
        }
        Common.sendSimpleNotification(this.connection, Messages.Server.RemoveDiscoveryPathNotification.type, path);
    }

    /**
     * Synchronously removes discovery path from SSP by sending a notification and then waiting for
     * 'discoveryPathRemoved' event to be fired
     * @param path path to the desired directory or a DiscoveryPath object containing the given filepath
     * @param timeout timeout in milliseconds
     */
    removeDiscoveryPathSync(path: string | Protocol.DiscoveryPath, timeout: number = 2000): Promise<Protocol.DiscoveryPath> {
        if (typeof(path) === 'string') {
            path = { filepath: path };
        }

        return Common.sendNotificationSync(this.connection, Messages.Server.RemoveDiscoveryPathNotification.type,
            path, this.emitter, 'discoveryPathRemoved', timeout, ErrorMessages.REMOVEPATH_TIMEOUT);
    }

    /**
     * Retrieves all discovery paths from the SSP server
     * @param timeout timeout in milliseconds
     */
    getDiscoveryPaths(timeout: number = 2000): Promise<Protocol.DiscoveryPath[]> {
        return Common.sendSimpleRequest(this.connection, Messages.Server.GetDiscoveryPathsRequest.type,
             null, timeout, ErrorMessages.GETPATHS_TIMEOUT);
    }
}