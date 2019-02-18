import { MessageConnection, RequestType, NotificationType } from 'vscode-jsonrpc';
import { EventEmitter } from 'events';

/**
 * Helper class for sending requests and notifications
 */
export class Common {

  public static readonly DEFAULT_TIMEOUT: number =  2000;
  public static readonly LONG_TIMEOUT: number =  6000;

    /**
     * Template method for sending requests and receiving the response
     * @param connection the message connection to RSP server
     * @param messageType type of the message being sent
     * @param payload parameters of the message being sent
     * @param timeout timeout in milliseconds
     * @param timeoutMessage error message in case of timeout
     */
    static sendSimpleRequest<P, R>(connection: MessageConnection, messageType: RequestType<P, R, any, any>, payload: P, timeout: number, timeoutMessage: string): Promise<R> {
        return new Promise<R>((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(timeoutMessage));
            }, timeout);

            return connection.sendRequest(messageType, payload).then(result => {
                clearTimeout(timer);
                resolve(result);
            });
        });
    }

    /**

     * Template method for sending notifications and synchronously waiting for a response by subscribing to an event
     * @param connection the message connection to RSP server
     * @param messageType type of the message being sent
     * @param payload parameters of the message being sent
     * @param emitter event emitter used to subscribe for the response event
     * @param eventId id/name of the response event to wait for
     * @param listener callback to handle the response event parameters
     * @param timeout timeout in milliseconds
     * @param timeoutMessage error message in case of timeout
     */
    static sendRequestSync<P, R, E>(connection: MessageConnection, messageType: RequestType<P, R, any, any>, payload: P, emitter: EventEmitter,
         eventId: string, listener: (params: E) => boolean, timeout: number, timeoutMessage: string): Promise<E> {
        return new Promise<E>((resolve, reject) => {
            const timer = setTimeout(() => {
                return reject(new Error(timeoutMessage));
            }, timeout);

            let response: Thenable<R>;
            const handler = (params: E) => {
                if (listener(params)) {
                    response.then(() => {
                        clearTimeout(timer);
                        emitter.removeListener(eventId, listener);
                        resolve(params);
                    });
                }
            };

            emitter.prependListener(eventId, handler);
            response = connection.sendRequest(messageType, payload);
        });
    }

    /**
     * Template method for sending simple notifications to the server
     * @param connection message connection to the server
     * @param messageType type of the notification being sent
     * @param payload payload (parameters) of the message being sent
     */
    static sendSimpleNotification<P>(connection: MessageConnection, messageType: NotificationType<P, any>, payload: P): void {
        connection.sendNotification(messageType, payload);
    }
}

/**
 * Error messages
 */
export namespace ErrorMessages {
    export const FINDBEANS_TIMEOUT = 'Failed to retrieve server beans in time';
    export const ADDPATH_TIMEOUT = 'Failed to add discovery path in time';
    export const REMOVEPATH_TIMEOUT = 'Failed to remove discovery path in time';
    export const GETPATHS_TIMEOUT = 'Failed to retrieve discovery paths in time';
    export const GETSERVERS_TIMEOUT = 'Failed to retrieve servers in time';
    export const GETSERVERTYPES_TIMEOUT = 'Failed to retrieve supported servers in time';
    export const GETREQUIREDATTRS_TIMEOUT = 'Failed to retrieve required server attributes in time';
    export const GETOPTIONALATTRS_TIMEOUT = 'Failed to retrieve optional server attributes in time';
    export const DELETESERVER_TIMEOUT = 'Failed to delete server in time';
    export const GETLAUNCHMODES_TIMEOUT = 'Failed to get launch modes in time';
    export const GETREQUIREDLAUNCHATTRS_TIMEOUT = 'Failed to get required launch attributes in time';
    export const GETOPTIONALLAUNCHATTRS_TIMEOUT = 'Failed to get optional launch attributes in time';
    export const GETLAUNCHCOMMAND_TIMEOUT = 'Failed to get launch command in time';
    export const SERVERSTARTINGBYCLIENT_TIMEOUT = 'Failed to notify of server starting in time';
    export const SERVERSTARTEDBYCLIENT_TIMEOUT = 'Failed to notify of server started in time';
    export const STARTSERVER_TIMEOUT = 'Failed to start server in time';
    export const STOPSERVER_TIMEOUT = 'Failed to stop server in time';
    export const CREATESERVER_TIMEOUT = 'Failed to create server in time';
    export const REGISTERCLIENT_CAPABILITIES_TIMEOUT = 'Failed to register capabilities';
    export const GETDEPLOYABLES_TIMEOUT = 'Failed to get deployables in time';
    export const ADDDEPLOYABLE_TIMEOUT = 'Failed to add deployable in time';
    export const REMOVEDEPLOYABLE_TIMEOUT = 'Failed to remove deployable in time';
    export const PUBLISH_TIMEOUT = 'Failed to publish server in time';
    export const LISTDOWNLOADABLERUNTIMES_TIMEOUT = 'Failed to list downloadable runtimes in time';
    export const DOWNLOADRUNTIME_TIMEOUT = 'Failed to start the workflow to download a runtimes in time';
    export const GETSERVERSTATE_TIMEOUT = 'Failed to get server state in time';
}
