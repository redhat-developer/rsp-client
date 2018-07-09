import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as rpc from 'vscode-jsonrpc';
import { Messages } from '../src/protocol/messages';
import { Protocol } from '../src/protocol/protocol';
import { EventEmitter } from 'events';
import { Common, ErrorMessages } from '../src/util/common';
import { ServerLauncher } from '../src/util/serverLauncher';
import 'mocha';

const expect = chai.expect;
chai.use(sinonChai);

describe('Server Launcher Utility', () => {
    let sandbox: sinon.SinonSandbox;
    let connection: sinon.SinonStubbedInstance<rpc.MessageConnection>;
    let launcher: ServerLauncher;
    let emitter: EventEmitter;
    const defaultTimeout = 2000;

    let requestStub: sinon.SinonStub;

    const serverType: Protocol.ServerType = {
        description: 'a type',
        id: 'type',
        visibleName: 'the type'
    };
    const launchMode: Protocol.ServerLaunchMode = {
        desc: 'description',
        mode: 'mode'
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
    const cliArgs: Protocol.CommandLineDetails = {
        cmdLine: ['command'],
        envp: ['env'],
        properties: { foo: 'foo' },
        workingDir: 'dir'
    };
    const status: Protocol.Status = {
        code: 0,
        message: 'ok',
        ok: true,
        plugin: 'unknown',
        severity: 0,
        trace: 'trace'
    };
    const startingAttrs: Protocol.ServerStartingAttributes = {
        initiatePolling: true,
        request: launchParameters
    };
    const stopParameters: Protocol.StopServerAttributes = {
        force: false,
        id: 'id'
    };
    const serverHandle: Protocol.ServerHandle = {
        id: 'id',
        type: serverType
    };
    const serverStart: Protocol.StartServerResponse = {
        details: cliArgs,
        status: status
    };

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(rpc, 'createMessageConnection');
        const reader = sandbox.createStubInstance<rpc.StreamMessageReader>(rpc.StreamMessageReader);
        const writer = sandbox.createStubInstance<rpc.StreamMessageWriter>(rpc.StreamMessageWriter);

        connection = sandbox.stub(rpc.createMessageConnection(reader, writer));
        connection.onNotification = sandbox.stub().returns(null);

        emitter = new EventEmitter();
        launcher = new ServerLauncher(connection, emitter);
        requestStub = sandbox.stub(Common, 'sendSimpleRequest');
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('getLaunchModes should delegate to the Common utility', async () => {
        requestStub.resolves([launchMode]);
        const result = await launcher.getLaunchModes(serverType);

        expect(result).deep.equals([launchMode]);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWith(connection, Messages.Server.GetLaunchModesRequest.type, serverType,
            defaultTimeout, ErrorMessages.GETLAUNCHMODES_TIMEOUT);
    });

    it('getRequiredLaunchAttributes should delegate to the Common utility', async () => {
        requestStub.resolves(attributes);
        const result = await launcher.getRequiredLaunchAttributes(launchAttrRequest);

        expect(result).equals(attributes);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWith(connection, Messages.Server.GetRequiredLaunchAttributesRequest.type, launchAttrRequest,
            defaultTimeout, ErrorMessages.GETREQUIREDLAUNCHATTRS_TIMEOUT);
    });

    it('getOptionalLaunchAttributes should delegate to the Common utility', async () => {
        requestStub.resolves(attributes);
        const result = await launcher.getOptionalLaunchAttributes(launchAttrRequest);

        expect(result).equals(attributes);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWith(connection, Messages.Server.GetOptionalLaunchAttributesRequest.type, launchAttrRequest,
            defaultTimeout, ErrorMessages.GETOPTIONALLAUNCHATTRS_TIMEOUT);
    });

    it('getLaunchCommand should delegate to the Common utility', async () => {
        requestStub.resolves(cliArgs);
        const result = await launcher.getLaunchCommand(launchParameters);

        expect(result).equals(cliArgs);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWith(connection, Messages.Server.GetLaunchCommandRequest.type, launchParameters,
            defaultTimeout, ErrorMessages.GETLAUNCHCOMMAND_TIMEOUT);
    });

    it('serverStartingByClient should delegate to the Common utility', async () => {
        requestStub.resolves(status);
        const result = await launcher.serverStartingByClient(startingAttrs);

        expect(result).equals(status);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWith(connection, Messages.Server.ServerStartingByClientRequest.type, startingAttrs,
            defaultTimeout, ErrorMessages.SERVERSTARTINGBYCLIENT_TIMEOUT);
    });

    it('serverStartedByClient should delegate to the Common utility', async () => {
        requestStub.resolves(status);
        const result = await launcher.serverStartedByClient(launchParameters);

        expect(result).equals(status);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWith(connection, Messages.Server.ServerStartedByClientRequest.type, launchParameters,
            defaultTimeout, ErrorMessages.SERVERSTARTEDBYCLIENT_TIMEOUT);
    });

    it('startServerAsync should delegate to the Common utility', async () => {
        requestStub.resolves(serverStart);
        const result = await launcher.startServerAsync(launchParameters);

        expect(result).equals(serverStart);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWith(connection, Messages.Server.StartServerAsyncRequest.type, launchParameters,
            defaultTimeout, ErrorMessages.STARTSERVER_TIMEOUT);
    });

    it('stopServerAsync should delegate to the Common utility', async () => {
        requestStub.resolves(status);
        const result = await launcher.stopServerAsync(stopParameters);

        expect(result).equals(status);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWith(connection, Messages.Server.StopServerAsyncRequest.type, stopParameters,
            defaultTimeout, ErrorMessages.STOPSERVER_TIMEOUT);
    });

    describe('Synchronous Requests', () => {
        beforeEach(() => {
            connection.sendRequest = sandbox.stub().resolves(status);
        });

        it('startServerSync should send the correct message', async () => {
            const stateChange: Protocol.ServerStateChange = {
                server: serverHandle,
                state: 2
            };

            setTimeout(() => {
                emitter.emit('serverStateChanged', stateChange);
            }, 1);

            const result = await launcher.startServerSync(launchParameters);

            expect(result).equals(stateChange);
            expect(connection.sendRequest).calledOnce;
            expect(connection.sendRequest).calledWith(Messages.Server.StartServerAsyncRequest.type, launchParameters);
        });

        it('startServerSync should register for the correct event and unregister after done', async () => {
            const stateChange: Protocol.ServerStateChange = {
                server: serverHandle,
                state: 2
            };
            const regSpy = sandbox.spy(emitter, 'prependListener');
            const unregSpy = sandbox.spy(emitter, 'removeListener');

            setTimeout(() => {
                emitter.emit('serverStateChanged', stateChange);
            }, 1);

            await launcher.startServerSync(launchParameters);

            expect(regSpy).calledOnce;
            expect(regSpy).calledWith('serverStateChanged');
            expect(unregSpy).calledOnce;
            expect(unregSpy).calledWith('serverStateChanged');
        });

        it('startServerSync should only react to state.STARTED events', async () => {
            const stateChange: Protocol.ServerStateChange = {
                server: serverHandle,
                state: 1
            };
            const unregSpy = sandbox.spy(emitter, 'removeListener');

            setTimeout(() => {
                emitter.emit('serverStateChanged', stateChange);
            }, 1);

            try {
                await launcher.startServerSync(launchParameters, 1);
                expect.fail('No error thrown');
            } catch (err) {
                expect(unregSpy).not.called;
            }
        });

        it('startServerSync should error on timeout', async () => {
            try {
                await launcher.startServerSync(launchParameters, 1);
                expect.fail('No error thrown');
            } catch (err) {
                expect(err.message).equals(ErrorMessages.STARTSERVER_TIMEOUT);
            }
        });

        it('stopServerSync should send the correct message', async () => {
            const stateChange: Protocol.ServerStateChange = {
                server: serverHandle,
                state: 4
            };

            setTimeout(() => {
                emitter.emit('serverStateChanged', stateChange);
            }, 1);

            const result = await launcher.stopServerSync(stopParameters);

            expect(result).equals(stateChange);
            expect(connection.sendRequest).calledOnce;
            expect(connection.sendRequest).calledWith(Messages.Server.StopServerAsyncRequest.type, stopParameters);
        });

        it('stopServerSync should register for the correct event and unregister after done', async () => {
            const stateChange: Protocol.ServerStateChange = {
                server: serverHandle,
                state: 4
            };
            const regSpy = sandbox.spy(emitter, 'prependListener');
            const unregSpy = sandbox.spy(emitter, 'removeListener');

            setTimeout(() => {
                emitter.emit('serverStateChanged', stateChange);
            }, 1);

            await launcher.stopServerSync(stopParameters);

            expect(regSpy).calledOnce;
            expect(regSpy).calledWith('serverStateChanged');
            expect(unregSpy).calledOnce;
            expect(unregSpy).calledWith('serverStateChanged');
        });

        it('stopServerSync should only react to state.STOPPED events', async () => {
            const stateChange: Protocol.ServerStateChange = {
                server: serverHandle,
                state: 2
            };
            const unregSpy = sandbox.spy(emitter, 'removeListener');

            setTimeout(() => {
                emitter.emit('serverStateChanged', stateChange);
            }, 1);

            try {
                await launcher.stopServerSync(stopParameters, 1);
                expect.fail('No error thrown');
            } catch (err) {
                expect(unregSpy).not.called;
            }
        });

        it('startServerSync should error on timeout', async () => {
            try {
                await launcher.stopServerSync(stopParameters, 1);
                expect.fail('No error thrown');
            } catch (err) {
                expect(err.message).equals(ErrorMessages.STOPSERVER_TIMEOUT);
            }
        });
    });
});