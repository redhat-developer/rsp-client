import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { RSPClient } from '../src/client';
import * as net from 'net';
import * as rpc from 'vscode-jsonrpc';
import 'mocha';
import { EventEmitter } from 'events';
import { Messages } from '../src/protocol/generated/messages';

const expect = chai.expect;
chai.use(sinonChai);

describe('RSP Client', () => {
    const host = 'testhost';
    const port = 9001;
    let sandbox: sinon.SinonSandbox;
    let client: RSPClient;
    let rpcStub: sinon.SinonStub;
    let connectStub: sinon.SinonStub;
    let readerStub: sinon.SinonStub;
    let writerStub: sinon.SinonStub;
    let fakeSocket: net.Socket;

    const fakeConnection: rpc.MessageConnection = {
        dispose: () => {},
        listen: () => {},
        sendNotification: () => {},
        inspect: () => {},
        onClose: sinon.stub(),
        onDispose: sinon.stub(),
        onError: sinon.stub(),
        onNotification: sinon.stub(),
        onRequest: sinon.stub(),
        onUnhandledNotification: sinon.stub(),
        sendRequest: sinon.stub(),
        trace: sinon.stub()
    };

    beforeEach(() => {
        client = new RSPClient(host, port);
        fakeSocket = new net.Socket();

        sandbox = sinon.createSandbox();
        connectStub = sandbox.stub(net, 'connect').returns(fakeSocket);
        readerStub = sandbox.stub(rpc, 'StreamMessageReader');
        writerStub = sandbox.stub(rpc, 'StreamMessageWriter');
        rpcStub = sandbox.stub(rpc, 'createMessageConnection').returns(fakeConnection);
    });

    afterEach(() => {
        sandbox.restore();
    });

    async function fakeConnect() {
        setTimeout(() => {
            fakeSocket.emit('connect');
        }, 1);
        return await client.connect();
    }

    describe('Connection Handling', () => {
        it('connect should attach to websocket with given host and port', async () => {
            await fakeConnect();
            expect(connectStub).calledOnce;
            expect(connectStub).calledWith(port, host);
        });

        it('connect should create a message connection', async () => {
            await fakeConnect();
            expect(rpcStub).calledOnce;
            expect(rpcStub).calledWith(readerStub.prototype, writerStub.prototype);
        });

        it('disconnect should throw if no connection has been established', () => {
            try {
                client.disconnect();
                expect.fail('Disconnect did not throw without existing connection');
            } catch (err) {
                expect(err.message).equals('Connection not initialized');
            }
        });

        it('disconnect should dispose an existing connection and the underlying websocket', async () => {
            const disposeSpy = sandbox.spy(fakeConnection, 'dispose');
            const endSpy = sandbox.spy(fakeSocket, 'end');
            const destroySpy = sandbox.spy(fakeSocket, 'destroy');

            await fakeConnect();
            client.disconnect();

            expect(disposeSpy).calledOnce;
            expect(endSpy).calledAfter(disposeSpy);
            expect(destroySpy).calledAfter(endSpy);
        });

        it('shutdownServer should send shutdown notification and disconnect itself', async () => {
            const sendSpy = sandbox.spy(fakeConnection, 'sendNotification');
            const discStub = sandbox.stub(client, 'disconnect').returns();

            await fakeConnect();
            client.shutdownServer();

            expect(sendSpy).calledOnce;
            expect(sendSpy).calledWith(Messages.Server.ShutdownNotification.type);
            expect(discStub).calledAfter(sendSpy);
        });
    });

    describe('Event Handlers', () => {
        const listener = (arg: any) => {
            return;
        };
        let eventStub: sinon.SinonStub;

        beforeEach(async () => {
            await fakeConnect();
            eventStub = sandbox.stub(EventEmitter.prototype, 'on');
        });

        it('onDiscoveryPathAdded should add listener to discoveryPathAdded event', () => {
            client.getIncomingHandler().onDiscoveryPathAdded(listener);

            expect(eventStub).calledWith('discoveryPathAdded', listener);
        });

        it('onDiscoveryPathRemoved should add listener to discoveryPathRemoved event', () => {
            client.getIncomingHandler().onDiscoveryPathRemoved(listener);

            expect(eventStub).calledWith('discoveryPathRemoved', listener);
        });

        it('onServerAdded should add listener to serverAdded event', () => {
            client.getIncomingHandler().onServerAdded(listener);

            expect(eventStub).calledWith('serverAdded', listener);
        });

        it('onServerRemoved should add listener to serverRemoved event', () => {
            client.getIncomingHandler().onServerRemoved(listener);

            expect(eventStub).calledWith('serverRemoved', listener);
        });

        it('onServerStateChange should add listener to serverStateChanged event', () => {
            client.getIncomingHandler().onServerStateChanged(listener);

            expect(eventStub).calledWith('serverStateChanged', listener);
        });

        it('onServerOutputAppended should add listener to serverOutputAppended event', () => {
            client.getIncomingHandler().onServerProcessOutputAppended(listener);

            expect(eventStub).calledWith('serverProcessOutputAppended', listener);
        });

        it('onServerAttributeChange should add listener to serverAttributesChanged event', () => {
            client.getIncomingHandler().onServerAttributesChanged(listener);

            expect(eventStub).calledWith('serverAttributesChanged', listener);
        });

        it('onServerProcessCreated should add listener to serverProcessCreated event', () => {
            client.getIncomingHandler().onServerProcessCreated(listener);

            expect(eventStub).calledWith('serverProcessCreated', listener);
        });

        it('onServerProcessTerminated should add listener to serverProcessTerminated event', () => {
            client.getIncomingHandler().onServerProcessTerminated(listener);

            expect(eventStub).calledWith('serverProcessTerminated', listener);
        });

        it('getListeners should get all listeners for an event', () => {
            const listener = () => 'foo';
            const listenerStub = sandbox.stub(EventEmitter.prototype, 'listeners').returns([listener]);

            const listeners = client.getListeners('foo');
            expect(listeners).deep.equals([listener]);
            expect(listenerStub).calledOnceWith('foo');
        });

        it('removeListener should remove a listener from an event', () => {
            const listener = () => 'foo';
            const removeStub = sandbox.stub(EventEmitter.prototype, 'removeListener');

            client.removeListener('foo', listener);
            expect(removeStub).calledOnceWith('foo', listener);
        });

        it('removeAllListeners should remove all listeners from an event', () => {
            const removeStub = sandbox.stub(EventEmitter.prototype, 'removeAllListeners');

            client.removeAllListeners('foo');
            expect(removeStub).calledOnceWith('foo');
        });
    });
});