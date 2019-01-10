import { MessageConnection } from 'vscode-jsonrpc';
import { Protocol } from '../protocol/protocol';
import { Messages } from '../protocol/messages';
import { Common, ErrorMessages } from './common';

/**
 * Client capabilities handler
 */
export class Capabilities {

    private connection: MessageConnection;

    /**
     * Constructs a new server model handler
     * @param connection message connection to the RSP
     */
    constructor(connection: MessageConnection) {
        this.connection = connection;
    }

    /**
     * Register client capabilities to the server
     * @param capabilities the client capabilities
     * @param timeout timeout in milliseconds
     */
    registerClientCapabilities(capabilities: Protocol.ClientCapabilitiesRequest, timeout: number = 2000): Promise<Protocol.ServerCapabilitiesResponse> {
        return Common.sendSimpleRequest(this.connection, Messages.Server.RegisterClientCapabilitiesRequest.type,
             capabilities, timeout, ErrorMessages.REGISTERCLIENT_CAPABILITIES_TIMEOUT);
    }

    /**
     * Register a listen for the onStringPrompt notification.
     *
     * @param listener the listener
     */
    onStringPrompt(listener: (p: Protocol.StringPrompt) => Promise<string>): void {
        this.connection.onRequest(Messages.Client.PromptStringRequest.type, listener);
    }
}