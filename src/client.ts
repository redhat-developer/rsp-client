import * as net from 'net';
import * as rpc from 'vscode-jsonrpc';
import { Protocol } from './protocol/generated/protocol';
import { Messages } from './protocol/generated/messages';
import { ServerCreation } from './util/serverCreation';
import { EventEmitter } from 'events';
import { Incoming } from './protocol/generated/incoming';
import { Outgoing } from './protocol/generated/outgoing';
import { OutgoingSynchronous } from './util/outgoingsync';
import { Common } from './util/common';

/**
 * Runtime Server Protocol client implementation using JSON RPC
 */
export class RSPClient {

    private host: string;
    private port: number;
    private socket: net.Socket;
    private connection: rpc.MessageConnection;
    private emitter: EventEmitter;
    private serverUtil: ServerCreation;

    private incoming: Incoming;
    private outgoing: Outgoing;
    private outgoingSync: OutgoingSynchronous;

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
    connect(timeout: number = Common.DEFAULT_TIMEOUT): Promise<void> {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                return reject(new Error(`Failed to establish connection to ${this.host}:${this.port} within time`));
            }, timeout);

            this.socket = net.connect(this.port, this.host);
            this.socket.on('connect', () => {
                this.connection = rpc.createMessageConnection(
                    new rpc.StreamMessageReader(this.socket),
                    new rpc.StreamMessageWriter(this.socket));
                if (this.connection.trace) {
                    this.connection.trace(rpc.Trace.Verbose, {log: (message: string, data?: string) => {
                        console.log(`Message=${message} data=${data}`);
                    }});
                }

                this.connection.listen();
                this.serverUtil = new ServerCreation(this.connection, this.emitter);

                this.incoming = new Incoming(this.connection, this.emitter);
                this.outgoing = new Outgoing(this.connection);
                this.outgoingSync = new OutgoingSynchronous(this.connection, this.emitter);
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

    getIncomingHandler(): Incoming {
        return this.incoming;
    }

    getOutgoingHandler(): Outgoing {
        return this.outgoing;
    }

    getOutgoingSyncHandler(): OutgoingSynchronous {
        return this.outgoingSync;
    }

    getServerCreation(): ServerCreation {
        return this.serverUtil;
    }

    /**
     * Returns the capabilities implemented by the client
     */
    getCapabilities(): Protocol.ClientCapabilitiesRequest {
        return {map: {'protocol.version': '0.14.0', 'prompt.string': 'true'}};
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
