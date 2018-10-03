import { MessageConnection, RequestHandler } from 'vscode-jsonrpc';
import { Protocol } from '../protocol/protocol';
import { Messages } from '../protocol/messages';
import { EventEmitter } from 'events';

/**
 * Client capabilities handler
 */
export class LocalPromise extends Promise<string> {
    resolve: (s: string) => void;
    reject: (e: Error) => void;

    constructor(callback: (resolve: (s: string) => void, reject: (e: Error) => void) => void) {
        super((resolve, reject) => {
        });
}

}

export class Capabilities {

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
        this.listenToClientCapabilities();
    }

    /**
     * Subscribe to server creation and deletion events
     */
    private listenToClientCapabilities() {
        const handler: RequestHandler<Protocol.CapabilitiesRequest, Protocol.CapabilitiesResponse, void> = (p, token) => {
            const response: Protocol.CapabilitiesResponse = {map: {}};
            p.list.forEach(element => {
                if (element === 'protocol.version') {
                    response.map[element] = '0.10.0';
                } else if (element === 'prompt.string') {
                    response.map[element] =  'true';
                }
            });
            return response;
    };
    let acceptor: (s: string) => void;
    let rejector: (e: Error) => void;
    const promise = new Promise<string>((resolve, reject) => {
        acceptor = (s: string) => {
            resolve(s);
        };
        rejector = (e: Error) => {
            reject(e);
        };
    });
 this.connection.onRequest(Messages.Client.GetClientCapabilitiesRequest.type, handler);
        const handler1: RequestHandler<Protocol.StringPrompt, String, void> = (p, token) => {
            this.emitter.emit(Messages.Client.PromptStringRequest.type.method, p, acceptor, rejector);
            return promise;
        };
        this.connection.onRequest(Messages.Client.PromptStringRequest.type, handler1);
    }
}