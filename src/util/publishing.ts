import { MessageConnection } from 'vscode-jsonrpc';
import { Common, ErrorMessages } from './common';
import { Protocol } from '../main';
import { Messages } from '../protocol/messages';

/**
 * Publishing requests handler
 */
export class Publishing {

    private connection: MessageConnection;

    /**
     * Constructs a new download runtimes handler
     * @param connection message connection to the RSP
     */
    constructor(connection: MessageConnection) {
        this.connection = connection;
    }

  /**
   * Get a list of deployments for the given server
   *
   * @param server A server handle see {@link Protocol.ServerHandle}
   * @param timeout timeout in milliseconds
   */
    getDeployables(server: Protocol.ServerHandle, timeout: number = Common.LONG_TIMEOUT): Promise<Protocol.DeployableState[]> {
        return Common.sendSimpleRequest(this.connection, Messages.Server.GetDeployablesRequest.type, server,
            timeout, ErrorMessages.GETDEPLOYABLES_TIMEOUT);
    }

    /**
     * Add a deployable to the given server
     *
     * @param req A request properties object {@link Protocol.ModifyDeployableRequest}
     * @param timeout timeout in milliseconds
     */
    addDeployable(req: Protocol.ModifyDeployableRequest, timeout: number = Common.LONG_TIMEOUT): Promise<Protocol.Status> {
        return Common.sendSimpleRequest(this.connection, Messages.Server.AddDeployableRequest.type, req,
            timeout, ErrorMessages.ADDDEPLOYABLE_TIMEOUT);
    }

    /**
     * Remove a deployable from the given server
     *
     * @param req A request properties object {@link Protocol.ModifyDeployableRequest}
     * @param timeout timeout in milliseconds
     */
    removeDeployable(req: Protocol.ModifyDeployableRequest, timeout: number = Common.LONG_TIMEOUT): Promise<Protocol.Status> {
        return Common.sendSimpleRequest(this.connection, Messages.Server.RemoveDeployableRequest.type, req,
            timeout, ErrorMessages.REMOVEDEPLOYABLE_TIMEOUT);
    }

    /**
     * Publishes all outstanding changes to the given server
     *
     * @param server A server handle see {@link Protocol.ServerHandle}
     * @param timeout timeout in milliseconds
     */
    publish(req: Protocol.PublishServerRequest, timeout: number = Common.LONG_TIMEOUT): Promise<Protocol.Status> {
        return Common.sendSimpleRequest(this.connection, Messages.Server.PublishRequest.type, req,
            timeout, ErrorMessages.PUBLISH_TIMEOUT);
    }
}
