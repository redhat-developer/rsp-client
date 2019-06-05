import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as rpc from 'vscode-jsonrpc';
import 'mocha';
import { EventEmitter } from 'events';
import { Messages } from '../src/protocol/generated/messages';
import { Protocol } from '../src/protocol/generated/protocol';
import { Common } from '../src/util/common';
import { Outgoing, ErrorMessages } from '../src/protocol/generated/outgoing';
import { OutgoingSynchronous } from '../src/util/outgoingsync';
import { ServerState } from '../src/main';

const expect = chai.expect;
chai.use(sinonChai);

describe('Server Launcher Utility', () => {
    let sandbox: sinon.SinonSandbox;
    let connection: sinon.SinonStubbedInstance<rpc.MessageConnection>;
    let outgoing: Outgoing;
    let outgoingSync: OutgoingSynchronous;
    let emitter: EventEmitter;

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
        serverTypeId: 'id',
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
        outgoing = new Outgoing(connection);
        outgoingSync = new OutgoingSynchronous(connection, emitter);
        requestStub = sandbox.stub(Common, 'sendSimpleRequest');
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('getLaunchModes should delegate to the Common utility', async () => {
        requestStub.resolves([launchMode]);
        const result = await outgoing.getLaunchModes(serverType);

        expect(result).deep.equals([launchMode]);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWith(connection, Messages.Server.GetLaunchModesRequest.type, serverType,
            Common.DEFAULT_TIMEOUT, ErrorMessages.GETLAUNCHMODES_TIMEOUT);
    });

    it('getRequiredLaunchAttributes should delegate to the Common utility', async () => {
        requestStub.resolves(attributes);
        const result = await outgoing.getRequiredLaunchAttributes(launchAttrRequest);

        expect(result).equals(attributes);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWith(connection, Messages.Server.GetRequiredLaunchAttributesRequest.type, launchAttrRequest,
            Common.DEFAULT_TIMEOUT, ErrorMessages.GETREQUIREDLAUNCHATTRIBUTES_TIMEOUT);
    });

    it('getOptionalLaunchAttributes should delegate to the Common utility', async () => {
        requestStub.resolves(attributes);
        const result = await outgoing.getOptionalLaunchAttributes(launchAttrRequest);

        expect(result).equals(attributes);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWith(connection, Messages.Server.GetOptionalLaunchAttributesRequest.type, launchAttrRequest,
            Common.DEFAULT_TIMEOUT, ErrorMessages.GETOPTIONALLAUNCHATTRIBUTES_TIMEOUT);
    });

    it('getLaunchCommand should delegate to the Common utility', async () => {
        requestStub.resolves(cliArgs);
        const result = await outgoing.getLaunchCommand(launchParameters);

        expect(result).equals(cliArgs);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWith(connection, Messages.Server.GetLaunchCommandRequest.type, launchParameters,
            Common.DEFAULT_TIMEOUT, ErrorMessages.GETLAUNCHCOMMAND_TIMEOUT);
    });

    it('serverStartingByClient should delegate to the Common utility', async () => {
        requestStub.resolves(status);
        const result = await outgoing.serverStartingByClient(startingAttrs);

        expect(result).equals(status);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWith(connection, Messages.Server.ServerStartingByClientRequest.type, startingAttrs,
            Common.DEFAULT_TIMEOUT, ErrorMessages.SERVERSTARTINGBYCLIENT_TIMEOUT);
    });

    it('serverStartedByClient should delegate to the Common utility', async () => {
        requestStub.resolves(status);
        const result = await outgoing.serverStartedByClient(launchParameters);

        expect(result).equals(status);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWith(connection, Messages.Server.ServerStartedByClientRequest.type, launchParameters,
            Common.DEFAULT_TIMEOUT, ErrorMessages.SERVERSTARTEDBYCLIENT_TIMEOUT);
    });

    it('startServerAsync should delegate to the Common utility', async () => {
        requestStub.resolves(serverStart);
        const result = await outgoing.startServerAsync(launchParameters);

        expect(result).equals(serverStart);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWith(connection, Messages.Server.StartServerAsyncRequest.type, launchParameters,
            Common.DEFAULT_TIMEOUT, ErrorMessages.STARTSERVERASYNC_TIMEOUT);
    });

    it('stopServerAsync should delegate to the Common utility', async () => {
        requestStub.resolves(status);
        const result = await outgoing.stopServerAsync(stopParameters);

        expect(result).equals(status);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWith(connection, Messages.Server.StopServerAsyncRequest.type, stopParameters,
            Common.DEFAULT_TIMEOUT, ErrorMessages.STOPSERVERASYNC_TIMEOUT);
    });

    describe('Synchronous Requests', () => {
        beforeEach(() => {
            connection.sendRequest = sandbox.stub().resolves(status);
        });

        it('startServerSync should send the correct message', async () => {
            const stateChange: Protocol.ServerState = {
                server: serverHandle,
                state: 2,
                publishState: 0,
                runMode: ServerState.RUN_MODE_RUN,
                deployableStates: []
            };

            setTimeout(() => {
                emitter.emit('serverStateChanged', stateChange);
            }, 1);

            const result = await outgoingSync.startServerSync(launchParameters);

            expect(result).equals(stateChange);
            expect(connection.sendRequest).calledOnce;
            expect(connection.sendRequest).calledWith(Messages.Server.StartServerAsyncRequest.type, launchParameters);
        });

        it('startServerSync should register for the correct event and unregister after done', async () => {
            const stateChange: Protocol.ServerState = {
                server: serverHandle,
                state: 2,
                publishState: 0,
                runMode: ServerState.RUN_MODE_RUN,
                deployableStates: []
            };
            const regSpy = sandbox.spy(emitter, 'prependListener');
            const unregSpy = sandbox.spy(emitter, 'removeListener');

            setTimeout(() => {
                emitter.emit('serverStateChanged', stateChange);
            }, 1);

            await outgoingSync.startServerSync(launchParameters);

            expect(regSpy).calledOnce;
            expect(regSpy).calledWith('serverStateChanged');
            expect(unregSpy).calledOnce;
            expect(unregSpy).calledWith('serverStateChanged');
        });

        it('startServerSync should only react to state.STARTED events', async () => {
            const stateChange: Protocol.ServerState = {
                server: serverHandle,
                state: 1,
                publishState: 0,
                runMode: ServerState.RUN_MODE_RUN,
                deployableStates: []
            };
            const unregSpy = sandbox.spy(emitter, 'removeListener');

            setTimeout(() => {
                emitter.emit('serverStateChanged', stateChange);
            }, 1);

            try {
                await outgoingSync.startServerSync(launchParameters, 1);
                expect.fail('No error thrown');
            } catch (err) {
                expect(unregSpy).not.called;
            }
        });

        it('startServerSync should error on timeout', async () => {
            try {
                await outgoingSync.startServerSync(launchParameters, 1);
                expect.fail('No error thrown');
            } catch (err) {
                expect(err.message).equals(ErrorMessages.STARTSERVERASYNC_TIMEOUT);
            }
        });

        it('stopServerSync should send the correct message', async () => {
            const stateChange: Protocol.ServerState = {
                server: serverHandle,
                state: 4,
                publishState: 0,
                runMode: ServerState.RUN_MODE_RUN,
                deployableStates: []
            };

            setTimeout(() => {
                emitter.emit('serverStateChanged', stateChange);
            }, 1);

            const result = await outgoingSync.stopServerSync(stopParameters);

            expect(result).equals(stateChange);
            expect(connection.sendRequest).calledOnce;
            expect(connection.sendRequest).calledWith(Messages.Server.StopServerAsyncRequest.type, stopParameters);
        });

        it('stopServerSync should register for the correct event and unregister after done', async () => {
            const stateChange: Protocol.ServerState = {
                server: serverHandle,
                state: 4,
                publishState: 0,
                runMode: ServerState.RUN_MODE_RUN,
                deployableStates: []
            };
            const regSpy = sandbox.spy(emitter, 'prependListener');
            const unregSpy = sandbox.spy(emitter, 'removeListener');

            setTimeout(() => {
                emitter.emit('serverStateChanged', stateChange);
            }, 1);

            await outgoingSync.stopServerSync(stopParameters);

            expect(regSpy).calledOnce;
            expect(regSpy).calledWith('serverStateChanged');
            expect(unregSpy).calledOnce;
            expect(unregSpy).calledWith('serverStateChanged');
        });

        it('stopServerSync should only react to state.STOPPED events', async () => {
            const stateChange: Protocol.ServerState = {
                server: serverHandle,
                state: 2,
                publishState: 0,
                runMode: ServerState.RUN_MODE_RUN,
                deployableStates: []
            };
            const unregSpy = sandbox.spy(emitter, 'removeListener');

            setTimeout(() => {
                emitter.emit('serverStateChanged', stateChange);
            }, 1);

            try {
                await outgoingSync.stopServerSync(stopParameters, 1);
                expect.fail('No error thrown');
            } catch (err) {
                expect(unregSpy).not.called;
            }
        });

        it('startServerSync should error on timeout', async () => {
            try {
                await outgoingSync.stopServerSync(stopParameters, 1);
                expect.fail('No error thrown');
            } catch (err) {
                expect(err.message).equals(ErrorMessages.STOPSERVERASYNC_TIMEOUT);
            }
        });
    });
});