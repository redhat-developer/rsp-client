import { MessageConnection } from 'vscode-jsonrpc';
import { EventEmitter } from 'events';

/**
 * Helper class for sending requests and notifications
 */
export class Common {

    /**
     * Template method for sending requests and receiving the response
     * @param connection the message connection to RSP server
     * @param messageType type of the message being sent
     * @param payload parameters of the message being sent
     * @param timeout timeout in milliseconds
     * @param timeoutMessage error message in case of timeout
     */
    static sendSimpleRequest(connection: MessageConnection, messageType: any, payload: any, timeout: number, timeoutMessage: string): Promise<any> {
        return new Promise((resolve, reject) => {
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
    static sendRequestSync(connection: MessageConnection, messageType: any , payload: any, emitter: EventEmitter,
         eventId: string, listener: (params: any) => boolean, timeout: number, timeoutMessage: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            const timer = setTimeout(() => {
                return reject(new Error(timeoutMessage));
            }, timeout);

            let response: Thenable<any>;
            const handler = (params: any) => {
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
    static sendSimpleNotification(connection: MessageConnection, messageType: any, payload: any): void {
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
}