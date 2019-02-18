import { MessageConnection } from 'vscode-jsonrpc';
import { Common, ErrorMessages } from './common';
import { Protocol } from '../main';
import { Messages } from '../protocol/messages';

/**
 * Server discovery requests handler
 */
export class DownloadRuntimes {

    private connection: MessageConnection;

    /**
     * Constructs a new download runtimes handler
     * @param connection message connection to the RSP
     */
    constructor(connection: MessageConnection) {
        this.connection = connection;
    }

    /**
     * Lists all downloadable runtimes.
     *
     * @param timeout timeout in milliseconds
     */
    listDownloadableRuntimes(timeout: number = Common.LONG_TIMEOUT): Promise<Protocol.ListDownloadRuntimeResponse> {
      return Common.sendSimpleRequest(this.connection, Messages.Server.ListDownloadableRuntimesRequest.type, null,
          timeout, ErrorMessages.LISTDOWNLOADABLERUNTIMES_TIMEOUT);
    }

    /**
     * Starts the workflow to download a single runtime.
     *
     * @param timeout timeout in milliseconds
     */
    downloadRuntime(req: Protocol.DownloadSingleRuntimeRequest, timeout: number = Common.LONG_TIMEOUT): Promise<Protocol.WorkflowResponse> {
      return Common.sendSimpleRequest(this.connection, Messages.Server.DownloadRuntimeRequest.type, req,
          timeout, ErrorMessages.DOWNLOADRUNTIME_TIMEOUT);
    }

}
