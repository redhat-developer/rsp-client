import { MessageConnection, RequestType, NotificationType } from 'vscode-jsonrpc';
import { EventEmitter } from 'events';

/**
 * Helper class for sending requests and notifications
 */
export class Common {

    public static readonly SHORT_TIMEOUT:     number =  2000;
    public static readonly DEFAULT_TIMEOUT:   number =  7500;
    public static readonly LONG_TIMEOUT:      number = 20000;
    public static readonly VERY_LONG_TIMEOUT: number = 60000;

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