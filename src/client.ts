import * as net from 'net';
import * as rpc from 'vscode-jsonrpc';
import Protocol from './protocol/protocol';
import Messages from './protocol/messages';
import { setTimeout, clearTimeout } from 'timers';
import Discovery from './util/discovery';
import ServerModel from './util/serverModel';
import ServerLauncher from './util/serverLauncher';
import { EventEmitter } from 'events';

/**
 * Simple Simple Server Protocol client implementation using json rpc
 */
class SSPClient {

    private host: string;
    private port: number;
    private socket: net.Socket;
    private connection: rpc.MessageConnection;
    private discoveryUtil: Discovery;
    private serverUtil: ServerModel;
    private launcherUtil: ServerLauncher;
    private emitter: EventEmitter;

    constructor(host: string, port: number) {
        this.host = host;
        this.port = port;
        this.emitter = new EventEmitter();
    }

    /**
     * Initiates connection to the SSP server
     * 
     * @param timeout operation timeout in milliseconds, default 2000 ms
     */
    connect(timeout: number = 2000): Promise<void> {
        return new Promise((resolve, reject) => {
            let timer = setTimeout(() => {
                reject(`Failed to establish connection to ${this.host}:${this.port} within time`);
            }, timeout)

            this.socket = net.connect(this.port, this.host, () => {
                this.connection = rpc.createMessageConnection(
                    new rpc.StreamMessageReader(this.socket),
                    new rpc.StreamMessageWriter(this.socket));
                this.connection.listen();

                this.discoveryUtil = new Discovery(this.connection, this.emitter);
                this.serverUtil = new ServerModel(this.connection, this.emitter);
                this.launcherUtil = new ServerLauncher(this.connection, this.emitter);
                clearTimeout(timer);
                resolve();
            }); 
        });          
    }

    /**
     * Terminates an existing connection
     * 
     * @throws {@link rpc.ConnectionError} if connection is not initialized or already disposed
     */
    disconnect(): void {
        if (!this.connection) {
            throw new rpc.ConnectionError(rpc.ConnectionErrors.Closed, 'Connection not initialized');
        }
        this.connection.dispose();
        this.socket.destroy();
    }

    /**
     * Terminates the currently running SSP server instance and disconnects itself
     */
    shutdownServer(): void {
        this.connection.sendNotification(Messages.Server.ShutdownNotification.type);
        this.disconnect();
    }

    /**
     * Retrieves {@link Protocol.ServerBean} object for servers located at a specific path
     * 
     * @param path location of the servers
     * @param timeout operation timeout in milliseconds, default 2000
     */
    findServerBeans(path: string, timeout: number = 2000): Promise<Protocol.ServerBean[]> {
        return this.discoveryUtil.findServerBeans(path, timeout);
    }

    /**
     * Adds a selected location to server discovery paths
     * 
     * @param path location to add
     * @param timeout operation timeout in milliseconds, default 2000
     */
    addDiscoveryPathSync(path: string, timeout: number = 2000): Promise<Protocol.DiscoveryPath> {
        return this.discoveryUtil.addDiscoveryPathSync(path, timeout);
    }

    /**
     * Adds a selected location to server discovery paths
     * 
     * @param path location to add
     * @param timeout operation timeout in milliseconds, default 2000
     */
    addDiscoveryPathAsync(path: string, timeout: number = 2000): void {
        this.discoveryUtil.addDiscoveryPathAsync(path, timeout);
    }

    /**
     * Removes a discovery path from the server
     * 
     * @param timeout operation timeout in milliseconds, default 2000
     */
    removeDiscoveryPathSync(path: string | Protocol.DiscoveryPath, timeout: number = 2000): Promise<Protocol.DiscoveryPath> {
        return this.discoveryUtil.removeDiscoveryPathSync(path, timeout);
    }

    /**
     * Removes a discovery path from the server
     * 
     * @param timeout operation timeout in milliseconds, default 2000
     */
    removeDiscoveryPathAsync(path: string | Protocol.DiscoveryPath, timeout: number = 2000): void {
        this.discoveryUtil.removeDiscoveryPathAsync(path, timeout);
    }

    /**
     * Retrieves all discovery paths from the server
     * 
     * @param timeout operation timeout in milliseconds, default 2000
     */
    getDiscoveryPaths(timeout: number = 2000): Promise<Protocol.DiscoveryPath[]> {
        return this.discoveryUtil.getDiscoveryPaths(timeout);
    }

    /**
     * Creates a server located at the given path
     * 
     * @param path path to the root folder of the server
     * @param id a unique identifier to be assigned to the server being created
     * @param timeout operation timeout in milliseconds, default 2000
     */
    createServerSync(pathOrBean: string | Protocol.ServerBean, id?: string, timeout: number = 2000): Promise<Protocol.ServerHandle> {
        if (typeof(pathOrBean) === 'string') {
            if (!id) {
                return Promise.reject('ID is required when creating server from a path');
            }
            return this.serverUtil.createServerFromPath(pathOrBean, id, timeout);
        } else {
            return this.serverUtil.createServerFromBean(pathOrBean, id, timeout);
        }
    }

    /**
     * Creates a server located at the given path
     * 
     * @param path path to the root folder of the server
     * @param id a unique identifier to be assigned to the server being created
     * @param timeout operation timeout in milliseconds, default 2000
     */
    createServerAsync(pathOrBean: string | Protocol.ServerBean, id?: string, timeout: number = 2000): Promise<Protocol.Status> {
        if (typeof(pathOrBean) === 'string') {
            if (!id) {
                return Promise.reject('ID is required when creating server from a path');
            }
            return this.serverUtil.createServerFromPathAsync(pathOrBean, id, timeout);
        } else {
            return this.serverUtil.createServerFromBeanAsync(pathOrBean, id, timeout);
        }
    }

    /**
     * Deletes a server using Simple Server Protocol
     * 
     * @param serverHandle {@link Protocol.ServerHandle} object identifying the server to be deleted
     * @param timeout operation timeout in milliseconds, default 2000
     */
    deleteServerSync(serverHandle: Protocol.ServerHandle, timeout: number = 2000): Promise<Protocol.ServerHandle> {
        return this.serverUtil.deleteServerSync(serverHandle, timeout);
    }

    /**
     * Deletes a server using Simple Server Protocol
     * 
     * @param serverHandle {@link Protocol.ServerHandle} object identifying the server to be deleted
     * @param timeout operation timeout in milliseconds, default 2000
     */
    deleteServerAsync(serverHandle: Protocol.ServerHandle, timeout: number = 2000): void {
        this.serverUtil.deleteServerAsync(serverHandle, timeout);
    }

    /**
     * Retrieves handles for all servers created within the SSP instance
     * 
     * @param timeout operation timeout in milliseconds, default 2000
     */
    getServerHandles(timeout: number = 2000): Promise<Protocol.ServerHandle[]> {
        return this.serverUtil.getServerHandles();    
    }

    /**
     * Retrieves attributes required for a specific server type
     * 
     * @param serverType {@link Protocol.ServerType} object representing the chosen type of server
     * @param timeout operation timeout in milliseconds, default 2000
     */
    getServerTypeRequiredAttributes(serverType: Protocol.ServerType, timeout: number = 2000): Promise<Protocol.Attributes> {
        return this.serverUtil.getServerTypeRequiredAttributes(serverType, timeout);
    }

    /**
     * Retrieves optional attributes for a specific server type
     * 
     * @param serverType {@link Protocol.ServerType} object representing the chosen type of server
     * @param timeout operation timeout in milliseconds, default 2000
     */
    getServerTypeOptionalAttributes(serverType: Protocol.ServerType, timeout: number = 2000): Promise<Protocol.Attributes> {
        return this.serverUtil.getServerTypeOptionalAttributes(serverType);
    }

    /**
     * Retrieves launch modes available for a given server type
     * 
     * @param serverType {@link Protocol.ServerType} object representing the chosen type of server
     * @param timeout operation timeout in milliseconds, default 2000
     */
    getServerLaunchModes(serverType: Protocol.ServerType, timeout: number = 2000): Promise<Protocol.ServerLaunchMode[]> {
        return this.launcherUtil.getLaunchModes(serverType, timeout);
    }

    /**
     * Retrieves required launch attributes for a given server using a given mode
     * 
     * @param launchAttrRequest object specifying the server id and launch mode
     * @param timeout operation timeout in milliseconds, default 2000
     */
    getServerRequiredLaunchAttributes(launchAttrRequest: Protocol.LaunchAttributesRequest, timeout: number = 2000): Promise<Protocol.Attributes> {
        return this.launcherUtil.getRequiredLaunchAttributes(launchAttrRequest, timeout);
    }

    /**
     * Retrieves optional launch attributes for a given server using a given mode
     * 
     * @param launchAttrRequest object specifying the server id and launch mode
     * @param timeout operation timeout in milliseconds, default 2000
     */
    getServerOptionalLaunchAttributes(launchAttrRequest: Protocol.LaunchAttributesRequest, timeout: number = 2000): Promise<Protocol.Attributes> {
        return this.launcherUtil.getOptionalLaunchAttributes(launchAttrRequest, timeout);
    }

    /**
     * Retrieves launch command for a given server, usable to manually launch the server from CLI
     * 
     * @param launchParameters object representing the given attributes required to launch a given server
     * @param timeout operation timeout in milliseconds, default 2000
     */
    getServerLaunchCommand(launchParameters: Protocol.LaunchParameters, timeout: number = 2000): Promise<Protocol.CommandLineDetails> {
        return this.launcherUtil.getLaunchCommand(launchParameters, timeout);
    }

    /**
     * Notifies the SSP that the client is launching one of the servers manually to update its state
     * 
     * @param startingAttributes object representing the server being launched, set the 'initiatePolling' attribute to true to let SSP
     *  track the server's launch state to notify when it finished launching
     * @param timeout operation timeout in milliseconds, default 2000
     */
    serverStartingByClient(startingAttributes: Protocol.ServerStartingAttributes, timeout: number = 2000): Promise<Protocol.Status> {
        return this.launcherUtil.serverStartingByClient(startingAttributes, timeout);
    }

    /**
     * Notifies the SSP that the client has launched one of the servers manually to update its state
     * 
     * @param startingAttributes object representing the server launched
     * @param timeout operation timeout in milliseconds, default 2000
     */
    serverStartedByClient(launchParameters: Protocol.LaunchParameters, timeout: number = 2000): Promise<Protocol.Status> {
        return this.launcherUtil.serverStartedByClient(launchParameters, timeout);
    }

    /**
     * Requests the SSP to start a server. In order to then get the server state changes, subscribe to the
     * 'serverStateChanged' event
     * 
     * @param startAttributes 
     * @param timeout 
     */
    startServerAsync(startAttributes: Protocol.LaunchParameters, timeout: number = 2000): Promise<Protocol.Status> {
        return this.launcherUtil.startServerAsync(startAttributes, timeout);
    }

    /**
     * Requests the SSP to stop a server. In order to then get the server state changes, subscribe to the
     * 'serverStateChanged' event
     * 
     * @param startAttributes 
     * @param timeout 
     */
    stopServerAsync(stopAttributes: Protocol.StopServerAttributes, timeout: number = 2000): Promise<Protocol.Status> {
        return this.launcherUtil.stopServerAsync(stopAttributes, timeout);
    }

    /**
     * Requests the SSP to start a server and waits until it receives a notification that the server changed
     * its state to STARTED
     * 
     * @param startAttributes 
     * @param timeout 
     */
    startServerSync(startAttributes: Protocol.LaunchParameters, timeout: number = 60000): Promise<Protocol.ServerStateChange> {
        return this.launcherUtil.startServerSync(startAttributes, timeout);
    }

    /**
     * Requests the SSP to stop a server and waits until it receives a notification that the server changed
     * its state to STOPPED
     * 
     * @param startAttributes 
     * @param timeout 
     */
    stopServerSync(stopAttributes: Protocol.StopServerAttributes, timeout: number = 60000): Promise<Protocol.ServerStateChange> {
        return this.launcherUtil.stopServerSync(stopAttributes, timeout);
    }

    /**
     * Attaches a listener to discovery path added event
     * 
     * @param listener callback to handle the event
     */
    onDiscoveryPathAdded(listener: (arg: Protocol.DiscoveryPath) => void) {
        this.emitter.on('discoveryPathAdded', listener);
    }

    /**
     * Attaches a listener to discovery path removed event
     * 
     * @param listener callback to handle the event
     */
    onDiscoveryPathRemoved(listener: (arg: Protocol.DiscoveryPath) => void) {
        this.emitter.on('discoveryPathRemoved', listener);
    }

    /**
     * Attaches a listener to server creation event
     * 
     * @param listener callback to handle the event
     */
    onServerAdded(listener: (arg: Protocol.ServerHandle) => void) {
        this.emitter.on('serverAdded', listener);
    }

    /**
     * Attaches a listener to server deleteion event
     * 
     * @param listener callback to handle the event
     */
    onServerRemoved(listener: (arg: Protocol.ServerHandle) => void) {
        this.emitter.on('serverRemoved', listener);
    }

    /**
     * Attaches a listener to server state change
     * 
     * @param listener callback to handle the event
     */
    onServerStateChange(listener: (arg: Protocol.ServerStateChange) => void) {
        this.emitter.on('serverStateChanged', listener);
    }

    /**
     * Attaches a listener to the server displaying new output 
     * 
     * @param listener callback to handle the event
     */
    onServerOutputAppended(listener: (arg: Protocol.ServerProcessOutput) => void) {
        this.emitter.on('serverOutputAppended', listener);
    }

    /**
     * Attaches a listener to server attribute change
     * 
     * @param listener callback to handle the event
     */
    onServerAttributeChange(listener: (arg: Protocol.ServerHandle) => void) {
        this.emitter.on('serverAttributesChanged', listener);
    }

    /**
     * Attaches a listener to the server process being created
     * 
     * @param listener callback to handle the event
     */
    onServerProcessCreated(listener: (arg: Protocol.ServerProcess) => void) {
        this.emitter.on('serverProcessCreated', listener);
    }

    /**
     * Attaches a listener to the server process being terminated
     * 
     * @param listener callback to handle the event
     */
    onServerProcessTerminated(listener: (arg: Protocol.ServerProcess) => void) {
        this.emitter.on('serverProcessTerminated', listener);
    }
}

export default SSPClient;