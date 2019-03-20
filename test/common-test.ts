import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as rpc from 'vscode-jsonrpc';
import 'mocha';
import { EventEmitter } from 'events';
import { Messages } from '../src/protocol/generated/messages';
import { Protocol } from '../src/protocol/generated/protocol';
import { Common } from '../src/util/common';
import { ErrorMessages } from '../src/protocol/generated/outgoing';

const expect = chai.expect;
chai.use(sinonChai);

describe('Common', () => {
    let sandbox: sinon.SinonSandbox;
    let connection: sinon.SinonStubbedInstance<rpc.MessageConnection>;
    const defaultTimeout = 2000;
    const payload: Protocol.DiscoveryPath = { filepath: 'path' };

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(rpc, 'createMessageConnection');
        const reader = sandbox.createStubInstance<rpc.StreamMessageReader>(rpc.StreamMessageReader);
        const writer = sandbox.createStubInstance<rpc.StreamMessageWriter>(rpc.StreamMessageWriter);

        connection = sandbox.stub(rpc.createMessageConnection(reader, writer));
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('Sending Simple Requests', () => {
        const messageType = Messages.Server.FindServerBeansRequest.type;
        const bean: Protocol.ServerBean = {
            fullVersion: '1',
            location: 'location',
            name: 'server',
            serverAdapterTypeId: 'adapter',
            specificType: 'specificServer',
            typeCategory: 'type',
            version: '1'
        };

        beforeEach(() => {
            connection.sendRequest = sandbox.stub().resolves(bean);
        });

        it('should send the correct message with the correct payload', async () => {
            const result = await Common.sendSimpleRequest(connection, messageType, payload, defaultTimeout, ErrorMessages.FINDSERVERBEANS_TIMEOUT);

            expect(connection.sendRequest).calledOnce;
            expect(connection.sendRequest).calledWith(messageType, payload);
            expect(result).equals(bean);
        });

        it('should error on timeout', async () => {
            const temp = connection.sendRequest;
            connection.sendRequest = sandbox.stub().callsFake(() => {
                return new Promise(() => {
                    setTimeout(() => {
                        return temp(messageType, payload);
                    }, 20);
                });
            });

            try {
                await Common.sendSimpleRequest(connection, messageType, payload, 1, ErrorMessages.FINDSERVERBEANS_TIMEOUT);
                expect.fail('No error thrown on timeout');
            } catch (err) {
                expect(err.message).equals(ErrorMessages.FINDSERVERBEANS_TIMEOUT);
            }
        });
    });

    describe('Synchronous Requests', () => {
        const messageType = Messages.Server.AddDiscoveryPathRequest.type;
        let emitter: EventEmitter;
        const eventId = 'event';
        const listener = () => {
            return true;
        };

        beforeEach(() => {
            emitter = new EventEmitter();
            connection.sendRequest = sandbox.stub().resolves('response');
        });

        it('should send the correct message with the correct payload', async () => {
            setTimeout(() => {
                emitter.emit(eventId, payload);
            }, 1);

            const result = await Common.sendRequestSync(connection, messageType, payload, emitter, eventId,
                listener, defaultTimeout, ErrorMessages.ADDDISCOVERYPATH_TIMEOUT);

            expect(connection.sendRequest).calledOnce;
            expect(connection.sendRequest).calledWith(messageType, payload);
            expect(result).equals(payload);
        });

        it('should subscribe to the correct event and remove the listener after success', async () => {
            const subscribeSpy = sandbox.spy(emitter, 'prependListener');
            const unsubscribeSpy = sandbox.spy(emitter, 'removeListener');
            setTimeout(() => {
                emitter.emit(eventId, payload);
            }, 1);

            await Common.sendRequestSync(connection, messageType, payload, emitter, eventId,
                listener, defaultTimeout, ErrorMessages.ADDDISCOVERYPATH_TIMEOUT);

            expect(subscribeSpy).calledOnce;
            expect(subscribeSpy).calledWith(eventId);
            expect(connection.sendRequest).calledAfter(subscribeSpy);
            expect(unsubscribeSpy).calledOnce;
            expect(unsubscribeSpy).calledWith(eventId);
            expect(connection.sendRequest).calledBefore(unsubscribeSpy);
        });

        it('should ignore events that dont match the listener criteria', async () => {
            const badPayload = { filepath: 'foo' };
            const handler = (param: Protocol.DiscoveryPath) => {
                return param.filepath === payload.filepath;
            };

            setTimeout(() => {
                emitter.emit(eventId, badPayload);
            }, 1);
            setTimeout(() => {
                emitter.emit(eventId, payload);
            }, 3);

            const result = await Common.sendRequestSync(connection, messageType, payload, emitter, eventId,
                handler, defaultTimeout, ErrorMessages.ADDDISCOVERYPATH_TIMEOUT);

            expect(result).equals(payload);
        });

        it('should error on timeout', async () => {
            setTimeout(() => {
                emitter.emit('eventId', payload);
            }, 2);
            try {
                await Common.sendRequestSync(connection, messageType, payload, emitter, eventId,
                    listener, 1, ErrorMessages.ADDDISCOVERYPATH_TIMEOUT);
                expect.fail('No error thrown on timeout');
            } catch (err) {
                expect(err.message).equals(ErrorMessages.ADDDISCOVERYPATH_TIMEOUT);
            }
        });
    });

    describe('Simple Notifications', () => {
        const messageType = Messages.Server.ShutdownNotification.type;

        beforeEach(() => {
            connection.sendNotification = sandbox.stub().returns(null);
        });

        it('should send the correct message with the correct payload', () => {
            Common.sendSimpleNotification(connection, messageType, null);

            expect(connection.sendNotification).calledOnce;
            expect(connection.sendNotification).calledWith(messageType, null);
        });
    });
});