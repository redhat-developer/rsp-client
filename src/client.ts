import * as net from 'net';
import * as rpc from 'vscode-jsonrpc';
import { Protocol } from './protocol/protocol';
import { Messages } from './protocol/messages';
import { Discovery } from './util/discovery';
import { ServerModel } from './util/serverModel';
import { ServerLauncher } from './util/serverLauncher';
import { EventEmitter } from 'events';

/**
 * Runtime Server Protocol client implementation using JSON RPC
 */
export class RSPClient {

    private host: string;
    private port: number;
    private socket: net.Socket;
    private connection: rpc.MessageConnection;
    private discoveryUtil: Discovery;
    private serverUtil: ServerModel;
    private launcherUtil: ServerLauncher;
    private emitter: EventEmitter;

    /**
     * Constructs a new RSP client
     * @param host hostname/address to connect to
     * @param port port of the running RSP service
     */
    constructor(host: string, port: number) {
        this.host = host;
        this.port = port;
        this.emitter = new EventEmitter();
    }

    /**
     * Initiates connection to the RSP server
     *
     * @param timeout operation timeout in milliseconds, default 2000 ms
     */
    connect(timeout: number = 2000): Promise<void> {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                return reject(new Error(`Failed to establish connection to ${this.host}:${this.port} within time`));
            }, timeout);

            this.socket = net.connect(this.port, this.host);
            this.socket.on('connect', () => {
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
        this.emitter.removeAllListeners();
        this.connection.dispose();
        this.socket.end();
        this.socket.destroy();
    }

    /**
     * Terminates the currently running RSP server instance and disconnects itself
     */
    shutdownServer(): void {
        this.connection.sendNotification(Messages.Server.ShutdownNotification.type);
        this.disconnect();
    }

    /**
     * Finds suitable servers in a directory
     *
     * @param path path to the desired directory
     * @param timeout timeout in milliseconds
     */
    findServerBeans(path: string, timeout: number = 2000): Promise<Protocol.ServerBean[]> {
        return this.discoveryUtil.findServerBeans(path, timeout);
    }

    /**
     * Synchronously adds discovery path to RSP by sending a notification and then waiting for
     * 'discoveryPathAdded' event to be fired
     *
     * @param path path to the desired directory
     * @param timeout timeout in milliseconds
     */
    addDiscoveryPathSync(path: string, timeout: number = 2000): Promise<Protocol.DiscoveryPath> {
        return this.discoveryUtil.addDiscoveryPathSync(path, timeout);
    }

    /**
     * Sends notification to the RSP to add a directory to its discovery paths.
     * 'discoveryPathAdded' event will be fired when a response notification is received
     *
     * @param path path to the desired directory
     * @param timeout timeout in milliseconds
     */
    addDiscoveryPathAsync(path: string, timeout: number = 2000): Promise<Protocol.Status> {
       return this.discoveryUtil.addDiscoveryPathAsync(path, timeout);
    }

    /**
     * Synchronously removes discovery path from RSP by sending a notification and then waiting for
     * 'discoveryPathRemoved' event to be fired
     *
     * @param path path to the desired directory or a DiscoveryPath object containing the given filepath
     * @param timeout timeout in milliseconds
     */
    removeDiscoveryPathSync(path: string | Protocol.DiscoveryPath, timeout: number = 2000): Promise<Protocol.DiscoveryPath> {
        return this.discoveryUtil.removeDiscoveryPathSync(path, timeout);
    }

    /**

     * Sends notification to the RSP to remove a directory from its discovery paths.
     * 'discoveryPathRemoved' event will be fired when a response notification is received
     *
     * @param path path to the desired directory or a DiscoveryPath object containing the given filepath
     * @param timeout timeout in milliseconds
     */
    removeDiscoveryPathAsync(path: string | Protocol.DiscoveryPath, timeout: number = 2000): Promise<Protocol.Status> {
        return this.discoveryUtil.removeDiscoveryPathAsync(path, timeout);
    }

    /**
     * Retrieves all discovery paths from the server
     *
     * @param timeout timeout in milliseconds
     */
    getDiscoveryPaths(timeout: number = 2000): Promise<Protocol.DiscoveryPath[]> {
        return this.discoveryUtil.getDiscoveryPaths(timeout);
    }

    /**
     * Sends a request to create a server from a given directory, then waits for the 'serverAdded'
     * event with the given id
     *
     * @param path path to the server's root directory, or a ServerBean object representing the server
     * @param id unique identifier for the newly created server
     * @param timeout timeout in milliseconds
     */
    createServerSync(pathOrBean: string | Protocol.ServerBean, id?: string, timeout: number = 2000): Promise<Protocol.ServerHandle> {
        if (typeof(pathOrBean) === 'string') {
            if (!id) {
                return Promise.reject(new Error('ID is required when creating server from a path'));
            }
            return this.serverUtil.createServerFromPath(pathOrBean, id, timeout);
        } else {
            return this.serverUtil.createServerFromBean(pathOrBean, id, timeout);
        }
    }

    /**
     * Sends a request to create a server from a given directory, subscribe to the 'serverAdded'
     * event to see when the server creation is finished
     *
     * @param path path to the server's root directory, or a ServerBean object representing the server
     * @param id unique identifier for the newly created server
     * @param timeout timeout in milliseconds
     */
    createServerAsync(pathOrBean: string | Protocol.ServerBean, id?: string, timeout: number = 2000): Promise<Protocol.Status> {
        if (typeof(pathOrBean) === 'string') {
            if (!id) {
                return Promise.reject(new Error('ID is required when creating server from a path'));
            }
            return this.serverUtil.createServerFromPathAsync(pathOrBean, id, timeout);
        } else {
            return this.serverUtil.createServerFromBeanAsync(pathOrBean, id, timeout);
        }
    }

    /**
     * Sends notification to remove a server from RSP, then waits for the appropriate 'serverRemoved' event
     *
     * @param serverHandle server handle containing the server id and type, see {@link Protocol.ServerHandle}
     * @param timeout timeout in milliseconds
     */
    deleteServerSync(serverHandle: Protocol.ServerHandle, timeout: number = 2000): Promise<Protocol.ServerHandle> {
        return this.serverUtil.deleteServerSync(serverHandle, timeout);
    }

    /**
     * Sends notification to remove a server from RSP. Subscribe to the 'serverRemoved' event to see
     * when the removal finishes
     *
     * @param serverHandle server handle containing the server id and type, see {@link Protocol.ServerHandle}
     * @param timeout timeout in milliseconds
     */
    deleteServerAsync(serverHandle: Protocol.ServerHandle, timeout: number = 2000): Promise<Protocol.Status> {
        return this.serverUtil.deleteServerAsync(serverHandle, timeout);
    }

    /**
     * Retrieves handles for all servers created within the RSP instance
     *
     * @param timeout timeout in milliseconds
     */
    getServerHandles(timeout: number = 2000): Promise<Protocol.ServerHandle[]> {
        return this.serverUtil.getServerHandles(timeout);
    }

    /**
     * Retreives all supported server types
     *
     * @param timeout timeout in milliseconds
     */
    getServerTypes(timeout: number = 2000): Promise<Protocol.ServerType[]> {
        return this.serverUtil.getServerTypes(timeout);
    }

    /**
     * Retrieves attributes required for a specific server type
     *
     * @param serverType {@link Protocol.ServerType} object representing the chosen type of server
     * @param timeout timeout in milliseconds
     */
    getServerTypeRequiredAttributes(serverType: Protocol.ServerType, timeout: number = 2000): Promise<Protocol.Attributes> {
        return this.serverUtil.getServerTypeRequiredAttributes(serverType, timeout);
    }

    /**
     * Retrieves optional attributes for a specific server type
     *
     * @param serverType {@link Protocol.ServerType} object representing the chosen type of server
     * @param timeout timeout in milliseconds
     */
    getServerTypeOptionalAttributes(serverType: Protocol.ServerType, timeout: number = 2000): Promise<Protocol.Attributes> {
        return this.serverUtil.getServerTypeOptionalAttributes(serverType, timeout);
    }

    /**
     * Retrieves launch modes available for a given server type
     *
     * @param serverType {@link Protocol.ServerType} object representing the chosen type of server
     * @param timeout timeout in milliseconds
     */
    getServerLaunchModes(serverType: Protocol.ServerType, timeout: number = 2000): Promise<Protocol.ServerLaunchMode[]> {
        return this.launcherUtil.getLaunchModes(serverType, timeout);
    }

    /**
     * Retrieves required launch attributes for a given server using a given mode
     *
     * @param launchAttrRequest object specifying the server id and launch mode, see {@link Protocol.LaunchAttributesRequest}
     * @param timeout timeout in milliseconds
     */
    getServerRequiredLaunchAttributes(launchAttrRequest: Protocol.LaunchAttributesRequest, timeout: number = 2000): Promise<Protocol.Attributes> {
        return this.launcherUtil.getRequiredLaunchAttributes(launchAttrRequest, timeout);
    }

    /**
     * Retrieves optional launch attributes for a given server using a given mode
     *
     * @param launchAttrRequest object specifying the server id and launch mode, see {@link Protocol.LaunchAttributesRequest}
     * @param timeout timeout in milliseconds
     */
    getServerOptionalLaunchAttributes(launchAttrRequest: Protocol.LaunchAttributesRequest, timeout: number = 2000): Promise<Protocol.Attributes> {
        return this.launcherUtil.getOptionalLaunchAttributes(launchAttrRequest, timeout);
    }

    /**
     * Retrieves launch command for a given server, usable to manually launch the server from CLI
     *
     * @param launchParameters object representing the given attributes required to launch a given server, see {@link Protocol.LaunchParameters}
     * @param timeout timeout in milliseconds
     */
    getServerLaunchCommand(launchParameters: Protocol.LaunchParameters, timeout: number = 2000): Promise<Protocol.CommandLineDetails> {
        return this.launcherUtil.getLaunchCommand(launchParameters, timeout);
    }

    /**
     * Notifies the RSP that the client is launching one of the servers manually to update its state
     *
     * @param startingAttributes object representing the server being launched, set the 'initiatePolling' attribute to true to let RSP
     *  track the server's launch state to notify when it finished launching, see {@link Protocol.ServerStartingAttributes}
     * @param timeout timeout in milliseconds
     */
    serverStartingByClient(startingAttributes: Protocol.ServerStartingAttributes, timeout: number = 2000): Promise<Protocol.Status> {
        return this.launcherUtil.serverStartingByClient(startingAttributes, timeout);
    }

    /**
     * Notifies the RSP that the client has launched one of the servers manually to update its state
     *
     * @param startingAttributes object representing the server launched, see {@link Protocol.ServerStartingAttributes}
     * @param timeout timeout in milliseconds
     */
    serverStartedByClient(launchParameters: Protocol.LaunchParameters, timeout: number = 2000): Promise<Protocol.Status> {
        return this.launcherUtil.serverStartedByClient(launchParameters, timeout);
    }

    /**
     * Requests the RSP to start a server. In order to then get the server state changes, subscribe to the
     * 'serverStateChanged' event
     *
     * @param launchParameters parameters to start the server with, see {@link Protocol.LaunchParameters}
     * @param timeout timeout in milliseconds
     */
    startServerAsync(launchParameters: Protocol.LaunchParameters, timeout: number = 2000): Promise<Protocol.StartServerResponse> {
        return this.launcherUtil.startServerAsync(launchParameters, timeout);
    }

    /**
     * Requests the RSP to stop a server. In order to then get the server state changes, subscribe to the
     * 'serverStateChanged' event
     *
     * @param stopAttributes server stopping parameters, set force to 'true' to force shutdown, see {@link Protocol.StopServerAttributes}
     * @param timeout timeout in milliseconds
     */
    stopServerAsync(stopAttributes: Protocol.StopServerAttributes, timeout: number = 2000): Promise<Protocol.Status> {
        return this.launcherUtil.stopServerAsync(stopAttributes, timeout);
    }

    /**
     * Requests the RSP to start a server and waits until it receives a notification that the server changed
     * its state to STARTED
     *
     * @param launchParameters parameters to start the server with, see {@link Protocol.LaunchParameters}
     * @param timeout timeout in milliseconds
     */
    startServerSync(launchParameters: Protocol.LaunchParameters, timeout: number = 60000): Promise<Protocol.ServerStateChange> {
        return this.launcherUtil.startServerSync(launchParameters, timeout);
    }

    /**
     * Requests the RSP to stop a server and waits until it receives a notification that the server changed
     * its state to STOPPED
     *
     * @param stopAttributes server stopping parameters, set force to 'true' to force shutdown, see {@link Protocol.StopServerAttributes}
     * @param timeout timeout in milliseconds
     */
    stopServerSync(stopAttributes: Protocol.StopServerAttributes, timeout: number = 60000): Promise<Protocol.ServerStateChange> {
        return this.launcherUtil.stopServerSync(stopAttributes, timeout);
    }

    /**
     * Attaches a listener to discovery path added event
     *
     * @param listener callback to handle the event
     */
    onDiscoveryPathAdded(listener: (arg: Protocol.DiscoveryPath) => void): void {
        this.emitter.on('discoveryPathAdded', listener);
    }

    /**
     * Attaches a listener to discovery path removed event
     *
     * @param listener callback to handle the event
     */
    onDiscoveryPathRemoved(listener: (arg: Protocol.DiscoveryPath) => void): void {
        this.emitter.on('discoveryPathRemoved', listener);
    }

    /**
     * Attaches a listener to server creation event
     *
     * @param listener callback to handle the event
     */
    onServerAdded(listener: (arg: Protocol.ServerHandle) => void): void {
        this.emitter.on('serverAdded', listener);
    }

    /**
     * Attaches a listener to server deleteion event
     *
     * @param listener callback to handle the event
     */
    onServerRemoved(listener: (arg: Protocol.ServerHandle) => void): void {
        this.emitter.on('serverRemoved', listener);
    }

    /**
     * Attaches a listener to server state change
     *
     * @param listener callback to handle the event
     */
    onServerStateChange(listener: (arg: Protocol.ServerStateChange) => void): void {
        this.emitter.on('serverStateChanged', listener);
    }

    /**
     * Attaches a listener to the server displaying new output
     *
     * @param listener callback to handle the event
     */
    onServerOutputAppended(listener: (arg: Protocol.ServerProcessOutput) => void): void {
        this.emitter.on('serverOutputAppended', listener);
    }

    /**
     * Attaches a listener to server attribute change
     *
     * @param listener callback to handle the event
     */
    onServerAttributeChange(listener: (arg: Protocol.ServerHandle) => void): void {
        this.emitter.on('serverAttributesChanged', listener);
    }

    /**
     * Attaches a listener to the server process being created
     *
     * @param listener callback to handle the event
     */
    onServerProcessCreated(listener: (arg: Protocol.ServerProcess) => void): void {
        this.emitter.on('serverProcessCreated', listener);
    }

    /**
     * Attaches a listener to the server process being terminated
     *
     * @param listener callback to handle the event
     */
    onServerProcessTerminated(listener: (arg: Protocol.ServerProcess) => void): void {
        this.emitter.on('serverProcessTerminated', listener);
    }

    /**
     * Retrieves all listeners bound to an event
     *
     * @param eventName name of the event to get listeners for
     */
    getListeners(eventName: string): Function[] {
        return this.emitter.listeners(eventName);
    }

    /**
     * Removes a listener from an event
     *
     * @param eventName name of the event the listener is bound to
     * @param listener the listener to remove
     */
    removeListener(eventName: string, listener: (...args: any[]) => void): void {
        this.emitter.removeListener(eventName, listener);
    }

    /**
     * Removes all listeners from an event
     *
     * @param eventName name of the event to remove listeners from
     */
    removeAllListeners(eventName: string): void {
        this.emitter.removeAllListeners(eventName);
    }
}