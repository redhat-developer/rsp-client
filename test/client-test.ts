import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { RSPClient } from '../src/client';
import * as net from 'net';
import * as rpc from 'vscode-jsonrpc';
import { Discovery } from '../src/util/discovery';
import { ServerModel } from '../src/util/serverModel';
import { ServerLauncher } from '../src/util/serverLauncher';
import { Messages } from '../src/protocol/messages';
import { Protocol } from '../src/protocol/protocol';
import { EventEmitter } from 'events';
import 'mocha';

const expect = chai.expect;
chai.use(sinonChai);

describe('RSP Client', () => {
    const host = 'testhost';
    const port = 9001;
    const defaultTimeout = 2000;
    let sandbox: sinon.SinonSandbox;
    let client: RSPClient;
    let connectStub: sinon.SinonStub;
    let readerStub: sinon.SinonStub;
    let writerStub: sinon.SinonStub;
    let discoveryStub: sinon.SinonStubbedInstance<Discovery>;
    let modelStub: sinon.SinonStubbedInstance<ServerModel>;
    let launcherStub: sinon.SinonStubbedInstance<ServerLauncher>;

    const fakeSocket = {
        end: () => {},
        destroy: () => {},
        on: (event: string, listener: () => void) => {
            listener();
        }
    };
    const fakeConnection = {
        dispose: () => {},
        listen: () => {},
        sendNotification: () => {}
    };

    const discoveryPath: Protocol.DiscoveryPath = {
        filepath: 'path'
    };
    const serverType: Protocol.ServerType = {
        description: 'a type',
        id: 'type',
        visibleName: 'the type'
    };
    const serverHandle: Protocol.ServerHandle = {
        id: 'id',
        type: serverType
    };
    const serverBean: Protocol.ServerBean = {
        fullVersion: '1',
        location: 'location',
        name: 'server',
        serverAdapterTypeId: 'adapter',
        specificType: 'specificServer',
        typeCategory: 'type',
        version: '1'
    };
    const status: Protocol.Status = {
        code: 0,
        message: 'ok',
        ok: true,
        plugin: 'unknown',
        severity: 0,
        trace: 'trace'
    };
    const attributes: Protocol.Attributes = {
        attributes: {}
    };
    const launchAttrRequest: Protocol.LaunchAttributesRequest = {
        id: 'id',
        mode: 'mode'
    };
    const serverAttributes: Protocol.ServerAttributes = {
        id: 'id',
        serverType: 'type',
        attributes: attributes
    };
    const launchParameters: Protocol.LaunchParameters = {
        mode: 'mode',
        params: serverAttributes
    };
    const stopParameters: Protocol.StopServerAttributes = {
        force: false,
        id: 'id'
    };
    const stateChange: Protocol.ServerStateChange = {
        server: serverHandle,
        state: 0
    };
    const cliArgs: Protocol.CommandLineDetails = {
        cmdLine: ['command'],
        envp: ['env'],
        properties: { foo: 'foo' },
        workingDir: 'dir'
    };

    beforeEach(() => {
        client = new RSPClient(host, port);

        sandbox = sinon.createSandbox();
        connectStub = sandbox.stub(net, 'connect').returns(fakeSocket);
        readerStub = sandbox.stub(rpc, 'StreamMessageReader');
        writerStub = sandbox.stub(rpc, 'StreamMessageWriter');
        sandbox.stub(rpc, 'createMessageConnection').returns(fakeConnection);
        discoveryStub = sandbox.stub(Discovery.prototype);
        modelStub = sandbox.stub(ServerModel.prototype);
        launcherStub = sandbox.stub(ServerLauncher.prototype);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('Connection Handling', () => {
        it('connect should attach to websocket with given host and port', async () => {
            await client.connect();
            expect(connectStub).calledOnce;
            expect(connectStub).calledWith(port, host);
        });

        it('connect should create a message connection', async () => {
            await client.connect();
            expect(rpc.createMessageConnection).calledOnce;
            expect(rpc.createMessageConnection).calledWith(readerStub.prototype, writerStub.prototype);
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

            await client.connect();
            client.disconnect();

            expect(disposeSpy).calledOnce;
            expect(endSpy).calledAfter(disposeSpy);
            expect(destroySpy).calledAfter(endSpy);
        });

        it('shutdownServer should send shutdown notification and disconnect itself', async () => {
            const sendSpy = sandbox.spy(fakeConnection, 'sendNotification');
            const discStub = sandbox.stub(client, 'disconnect').returns(null);

            await client.connect();
            client.shutdownServer();

            expect(sendSpy).calledOnce;
            expect(sendSpy).calledWith(Messages.Server.ShutdownNotification.type);
            expect(discStub).calledAfter(sendSpy);
        });
    });

    describe('Discovery', () => {
        beforeEach(async () => {
            await client.connect();
        });

        it('findServerBeans should delegate to discovery utility', async () => {
            const response = [serverBean];
            discoveryStub.findServerBeans = sandbox.stub().resolves(response);

            const result = await client.findServerBeans('path');

            expect(discoveryStub.findServerBeans).calledWith('path', defaultTimeout);
            expect(result).deep.equal(response);
        });

        it('addDiscoveryPathSync should delegate to discovery utility', async () => {
            discoveryStub.addDiscoveryPathSync = sandbox.stub().resolves(discoveryPath);

            const result = await client.addDiscoveryPathSync('path');

            expect(discoveryStub.addDiscoveryPathSync).calledWith('path', defaultTimeout);
            expect(result).equals(discoveryPath);
        });

        it('addDiscoveryPathAsync should delegate to discovery utility', async () => {
            discoveryStub.addDiscoveryPathAsync = sandbox.stub().resolves(status);

            const result = await client.addDiscoveryPathAsync('path');

            expect(result).equals(status);
            expect(discoveryStub.addDiscoveryPathAsync).calledWith('path', defaultTimeout);
        });

        it('removeDiscoveryPathSync should delegate to discovery utility', async () => {
            discoveryStub.removeDiscoveryPathSync = sandbox.stub().resolves(discoveryPath);

            const result = await client.removeDiscoveryPathSync(discoveryPath);

            expect(discoveryStub.removeDiscoveryPathSync).calledWith(discoveryPath, defaultTimeout);
            expect(result).equals(discoveryPath);
        });

        it('removeDiscoveryPathAsync should delegate to discovery utility', async () => {
            discoveryStub.removeDiscoveryPathAsync = sandbox.stub().resolves(status);

            const result = await client.removeDiscoveryPathAsync('path');

            expect(result).equals(status);
            expect(discoveryStub.removeDiscoveryPathAsync).calledWith('path', defaultTimeout);
        });

        it('getDiscoveryPaths should delegate to discovery utility', async () => {
            const response = [discoveryPath];
            discoveryStub.getDiscoveryPaths = sandbox.stub().resolves(response);

            const result = await client.getDiscoveryPaths();

            expect(discoveryStub.getDiscoveryPaths).calledWith(defaultTimeout);
            expect(result).deep.equals(response);
        });
    });

    describe('Server Model', () => {
        beforeEach(async () => {
            await client.connect();
        });

        it('createServerSync should accept a path', async () => {
            const response = serverHandle;
            modelStub.createServerFromPath = sandbox.stub().resolves(response);

            const result = await client.createServerSync('path', 'id');

            expect(modelStub.createServerFromPath).calledWith('path', 'id', defaultTimeout);
            expect(result).equals(response);
        });

        it('createServerSync should require and id when called with a path', async () => {
            modelStub.createServerFromPath = sandbox.stub();

            try {
                await client.createServerSync('path');
                expect.fail('The method was called with no id');
            } catch (err) {
                expect(modelStub.createServerFromPath).not.called;
                expect(err.message).equals('ID is required when creating server from a path');
            }
        });

        it('createServerSync should accept a server bean', async () => {
            const response = serverHandle;
            modelStub.createServerFromBean = sandbox.stub().resolves(response);

            const result = await client.createServerSync(serverBean);

            expect(modelStub.createServerFromBean).calledWith(serverBean, undefined, defaultTimeout);
            expect(result).equals(response);
        });

        it('createServerAsync should accept a path', async () => {
            const response = status;
            modelStub.createServerFromPathAsync = sandbox.stub().resolves(response);

            const result = await client.createServerAsync('path', 'id');

            expect(modelStub.createServerFromPathAsync).calledWith('path', 'id', defaultTimeout);
            expect(result).equals(response);
        });

        it('createServerAsync should require and id when called with a path', async () => {
            modelStub.createServerFromPathAsync = sandbox.stub();

            try {
                await client.createServerAsync('path');
                expect.fail('The method was called with no id');
            } catch (err) {
                expect(modelStub.createServerFromPathAsync).not.called;
                expect(err.message).equals('ID is required when creating server from a path');
            }
        });

        it('createServerAsync should accept a server bean', async () => {
            const response = status;
            modelStub.createServerFromBeanAsync = sandbox.stub().resolves(response);

            const result = await client.createServerAsync(serverBean);

            expect(modelStub.createServerFromBeanAsync).calledWith(serverBean, undefined, defaultTimeout);
            expect(result).equals(response);
        });

        it('deleteServerSync should delegate to server model utility', async () => {
            const response = serverHandle;
            modelStub.deleteServerSync = sandbox.stub().resolves(response);

            const result = await client.deleteServerSync(response);

            expect(modelStub.deleteServerSync).calledWith(response, defaultTimeout);
            expect(result).equals(response);
        });

        it('deleteServerAsync should delegate to server model utility', async () => {
            modelStub.deleteServerAsync = sandbox.stub().resolves(status);

            const result = await client.deleteServerAsync(serverHandle);

            expect(result).equals(status);
            expect(modelStub.deleteServerAsync).calledWith(serverHandle, defaultTimeout);
        });

        it('getServerHandles should delegate to server model utility', async () => {
            const response = [serverHandle];
            modelStub.getServerHandles = sandbox.stub().resolves(response);

            const result = await client.getServerHandles();

            expect(modelStub.getServerHandles).calledWith(defaultTimeout);
            expect(result).equals(response);
        });

        it('getServerTypes should delegate to server model utility', async () => {
            const response = [serverType];
            modelStub.getServerTypes = sandbox.stub().resolves(response);

            const result = await client.getServerTypes();

            expect(modelStub.getServerTypes).calledWith(defaultTimeout);
            expect(result).equals(response);
        });

        it('getServerTypeRequiredAttributes should delegate to server model utility', async () => {
            const response = attributes;
            modelStub.getServerTypeRequiredAttributes = sandbox.stub().resolves(response);

            const result = await client.getServerTypeRequiredAttributes(serverType);

            expect(modelStub.getServerTypeRequiredAttributes).calledWith(serverType, defaultTimeout);
            expect(result).equals(response);
        });

        it('getServerTypeOptionalAttributes should delegate to server model utility', async () => {
            const response = attributes;
            modelStub.getServerTypeOptionalAttributes = sandbox.stub().resolves(response);

            const result = await client.getServerTypeOptionalAttributes(serverType);

            expect(modelStub.getServerTypeOptionalAttributes).calledWith(serverType, defaultTimeout);
            expect(result).equals(response);
        });
    });

    describe('Server Launching', () => {
        beforeEach(async () => {
            await client.connect();
        });

        it('getServerLaunchModes should delegate to server launcher utility', async () => {
            const response: Protocol.ServerLaunchMode = {
                desc: 'a mode',
                mode: 'mode'
            };
            launcherStub.getLaunchModes = sandbox.stub().resolves([response]);

            const result = await client.getServerLaunchModes(serverType);

            expect(launcherStub.getLaunchModes).calledWith(serverType, defaultTimeout);
            expect(result).deep.equals([response]);
        });

        it('getServerRequiredLaunchAttributes should delegate to server launcher utility', async () => {
            const response = attributes;
            launcherStub.getRequiredLaunchAttributes = sandbox.stub().resolves(response);

            const result = await client.getServerRequiredLaunchAttributes(launchAttrRequest);

            expect(launcherStub.getRequiredLaunchAttributes).calledWith(launchAttrRequest, defaultTimeout);
            expect(result).equals(response);
        });

        it('getServerOptionalLaunchAttributes should delegate to server launcher utility', async () => {
            const response = attributes;
            launcherStub.getOptionalLaunchAttributes = sandbox.stub().resolves(response);

            const result = await client.getServerOptionalLaunchAttributes(launchAttrRequest);

            expect(launcherStub.getOptionalLaunchAttributes).calledWith(launchAttrRequest, defaultTimeout);
            expect(result).equals(response);
        });

        it('getServerLaunchCommand should delegate to server launcher utility', async () => {
            const response = cliArgs;
            launcherStub.getLaunchCommand = sandbox.stub().resolves(response);

            const result = await client.getServerLaunchCommand(launchParameters);

            expect(launcherStub.getLaunchCommand).calledWith(launchParameters, defaultTimeout);
            expect(result).equals(response);
        });

        it('serverStartingByClient should delegate to server launcher utility', async () => {
            const response = status;
            const params: Protocol.ServerStartingAttributes = {
                initiatePolling: true,
                request: launchParameters
            };

            launcherStub.serverStartingByClient = sandbox.stub().resolves(response);

            const result = await client.serverStartingByClient(params);

            expect(launcherStub.serverStartingByClient).calledWith(params, defaultTimeout);
            expect(result).equals(response);
        });

        it('serverStartedByClient should delegate to server launcher utility', async () => {
            const response = status;

            launcherStub.serverStartedByClient = sandbox.stub().resolves(response);

            const result = await client.serverStartedByClient(launchParameters);

            expect(launcherStub.serverStartedByClient).calledWith(launchParameters, defaultTimeout);
            expect(result).equals(response);
        });

        it('startServerAsync should delegate to server launcher utility', async () => {
            const response = status;

            launcherStub.startServerAsync = sandbox.stub().resolves(response);

            const result = await client.startServerAsync(launchParameters);

            expect(launcherStub.startServerAsync).calledWith(launchParameters, defaultTimeout);
            expect(result).equals(response);
        });

        it('stopServerAsync should delegate to server launcher utility', async () => {
            const response = status;

            launcherStub.stopServerAsync = sandbox.stub().resolves(response);

            const result = await client.stopServerAsync(stopParameters);

            expect(launcherStub.stopServerAsync).calledWith(stopParameters, defaultTimeout);
            expect(result).equals(response);
        });

        it('startServerSync should delegate to server launcher utility', async () => {
            const response = stateChange;

            launcherStub.startServerSync = sandbox.stub().resolves(response);

            const result = await client.startServerSync(launchParameters);

            expect(launcherStub.startServerSync).calledWith(launchParameters, defaultTimeout * 30);
            expect(result).equals(response);
        });

        it('stopServerSync should delegate to server launcher utility', async () => {
            const response = stateChange;

            launcherStub.stopServerSync = sandbox.stub().resolves(response);

            const result = await client.stopServerSync(stopParameters);

            expect(launcherStub.stopServerSync).calledWith(stopParameters, defaultTimeout * 30);
            expect(result).equals(response);
        });
    });

    describe('Event Handlers', () => {
        const listener = (arg: any) => {
            return;
        };
        let eventStub: sinon.SinonStub;

        beforeEach(async () => {
            await client.connect();
            eventStub = sandbox.stub(EventEmitter.prototype, 'on');
        });

        it('onDiscoveryPathAdded should add listener to discoveryPathAdded event', () => {
            client.onDiscoveryPathAdded(listener);

            expect(eventStub).calledWith('discoveryPathAdded', listener);
        });

        it('onDiscoveryPathRemoved should add listener to discoveryPathRemoved event', () => {
            client.onDiscoveryPathRemoved(listener);

            expect(eventStub).calledWith('discoveryPathRemoved', listener);
        });

        it('onServerAdded should add listener to serverAdded event', () => {
            client.onServerAdded(listener);

            expect(eventStub).calledWith('serverAdded', listener);
        });

        it('onServerRemoved should add listener to serverRemoved event', () => {
            client.onServerRemoved(listener);

            expect(eventStub).calledWith('serverRemoved', listener);
        });

        it('onServerStateChange should add listener to serverStateChanged event', () => {
            client.onServerStateChange(listener);

            expect(eventStub).calledWith('serverStateChanged', listener);
        });

        it('onServerOutputAppended should add listener to serverOutputAppended event', () => {
            client.onServerOutputAppended(listener);

            expect(eventStub).calledWith('serverOutputAppended', listener);
        });

        it('onServerAttributeChange should add listener to serverAttributesChanged event', () => {
            client.onServerAttributeChange(listener);

            expect(eventStub).calledWith('serverAttributesChanged', listener);
        });

        it('onServerProcessCreated should add listener to serverProcessCreated event', () => {
            client.onServerProcessCreated(listener);

            expect(eventStub).calledWith('serverProcessCreated', listener);
        });

        it('onServerProcessTerminated should add listener to serverProcessTerminated event', () => {
            client.onServerProcessTerminated(listener);

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