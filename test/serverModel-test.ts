import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as rpc from 'vscode-jsonrpc';
import 'mocha';
import { EventEmitter } from 'events';
import { Common } from '../src/util/common';
import { Messages } from '../src/protocol/generated/messages';
import { Protocol } from '../src/protocol/generated/protocol';
import { Outgoing, ErrorMessages } from '../src/protocol/generated/outgoing';
import { ServerCreation } from '../src/util/serverCreation';
import { OutgoingSynchronous, ServerState } from '../src/main';

const expect = chai.expect;
chai.use(sinonChai);

describe('Sever Model Utility', () => {
    let sandbox: sinon.SinonSandbox;
    let connection: sinon.SinonStubbedInstance<rpc.MessageConnection>;
    let emitter: EventEmitter;

    let requestStub: sinon.SinonStub;
    let syncStub: sinon.SinonStub;
    let serverCreation: ServerCreation;
    let outgoing: Outgoing;
    let outgoingSync: OutgoingSynchronous;

    const discoveryPath: Protocol.DiscoveryPath = {
        filepath: 'path'
    };
    const okStatus: Protocol.Status = {
        code: 0,
        message: 'ok',
        ok: true,
        plugin: 'unknown',
        severity: 0,
        trace: 'trace'
    };
    const createStatus: Protocol.CreateServerResponse = {
        status: okStatus,
        invalidKeys: []
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
    const serverType: Protocol.ServerType = {
        description: 'a type',
        id: 'type',
        visibleName: 'the type'
    };
    const serverHandle: Protocol.ServerHandle = {
        id: 'id',
        type: serverType
    };
    const attributes: Protocol.Attributes = {
        attributes: {}
    };

    const enum RunState {
        Unknown,
        Starting,
        Started,
        Stopping,
        Stopped
    }

    const enum PublishState {
        None,
        Incremental,
        Full,
        Add,
        Remove,
        Unknown
    }

    const deployableReference: Protocol.DeployableReference = {
        label: 'deployable-label',
        path: '/path/to/deployable'
    };

    const deployableState: Protocol.DeployableState = {
        server: serverHandle,
        reference: deployableReference,
        state: RunState.Started,
        publishState: PublishState.Add
    };

    const serverState: Protocol.ServerState = {
        server: serverHandle,
        state: RunState.Started,
        publishState: PublishState.Add,
        runMode: ServerState.RUN_MODE_RUN,
        deployableStates: [ deployableState ]
    };

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(rpc, 'createMessageConnection');
        const reader = sandbox.createStubInstance<rpc.StreamMessageReader>(rpc.StreamMessageReader);
        const writer = sandbox.createStubInstance<rpc.StreamMessageWriter>(rpc.StreamMessageWriter);

        connection = sandbox.stub(rpc.createMessageConnection(reader, writer));
        connection.onNotification = sandbox.stub().returns(null);

        emitter = new EventEmitter();
        serverCreation = new ServerCreation(connection, emitter);
        outgoing = new Outgoing(connection);
        outgoingSync = new OutgoingSynchronous(connection, emitter);
        requestStub = sandbox.stub(Common, 'sendSimpleRequest');
        syncStub = sandbox.stub(Common, 'sendRequestSync');
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('createSeverFromPathAsync should delegate to the Common utility', async () => {
        requestStub.onFirstCall().resolves([serverBean]);
        requestStub.onSecondCall().resolves(createStatus);

        const result = await serverCreation.createServerFromPathAsync(discoveryPath.filepath, 'id');
        const attributes: Protocol.ServerAttributes = {
            id: 'id',
            serverType: serverBean.serverAdapterTypeId,
            attributes: {
                'server.home.dir': serverBean.location
            }
        };

        expect(result).equals(createStatus);
        expect(requestStub).calledTwice;
        expect(requestStub).calledWithExactly(connection, Messages.Server.FindServerBeansRequest.type, discoveryPath,
            Common.DEFAULT_TIMEOUT / 2, ErrorMessages.FINDSERVERBEANS_TIMEOUT);
        expect(requestStub).calledWithExactly(connection, Messages.Server.CreateServerRequest.type, attributes,
            Common.DEFAULT_TIMEOUT, ErrorMessages.CREATESERVER_TIMEOUT);
    });

    it('createSeverFromBeanAsync should delegate to the Common utility', async () => {
        requestStub.resolves(createStatus);

        const result = await serverCreation.createServerFromBeanAsync(serverBean);
        const attributes: Protocol.ServerAttributes = {
            id: serverBean.name,
            serverType: serverBean.serverAdapterTypeId,
            attributes: {
                'server.home.dir': serverBean.location
            }
        };

        expect(result).equals(createStatus);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWithExactly(connection, Messages.Server.CreateServerRequest.type, attributes,
            Common.DEFAULT_TIMEOUT, ErrorMessages.CREATESERVER_TIMEOUT);
    });

    it('deleteServerSync should delegate to the Common utility', async () => {
        syncStub.resolves(serverHandle);

        const result = await outgoingSync.deleteServerSync(serverHandle);

        expect(result).equals(serverHandle);
        expect(syncStub).calledOnce;
        expect(syncStub).calledWith(connection, Messages.Server.DeleteServerRequest.type, serverHandle,
            emitter, 'serverRemoved', sinon.match.func, Common.DEFAULT_TIMEOUT, ErrorMessages.DELETESERVER_TIMEOUT);
    });

    it('deleteServerAsync should delegate to the Common utility', async () => {
        requestStub.resolves(okStatus);

        const result = await outgoing.deleteServer(serverHandle);

        expect(result).equals(okStatus);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWith(connection, Messages.Server.DeleteServerRequest.type, serverHandle);
    });

    it('getServerHandles should delegate to the Common utility', async () => {
        requestStub.resolves([serverHandle]);

        const result = await outgoing.getServerHandles();

        expect(result).deep.equals([serverHandle]);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWithExactly(connection, Messages.Server.GetServerHandlesRequest.type, null,
            Common.DEFAULT_TIMEOUT, ErrorMessages.GETSERVERHANDLES_TIMEOUT);
    });

    it('getServerState should send GetServerStateRequest', async () => {
        requestStub.resolves(serverState);

        const result = await outgoing.getServerState(serverHandle);

        expect(result).deep.equals(serverState);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWithExactly(connection, Messages.Server.GetServerStateRequest.type, serverHandle,
            Common.DEFAULT_TIMEOUT, ErrorMessages.GETSERVERSTATE_TIMEOUT);
    });

    it('getServerTypes should delegate to the Common utility', async () => {
        requestStub.resolves([serverType]);

        const result = await outgoing.getServerTypes();

        expect(result).deep.equals([serverType]);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWithExactly(connection, Messages.Server.GetServerTypesRequest.type, null,
            Common.DEFAULT_TIMEOUT, ErrorMessages.GETSERVERTYPES_TIMEOUT);
    });

    it('getServerTypeRequiredAttributes should delegate to the Common utility', async () => {
        requestStub.resolves(attributes);

        const result = await outgoing.getRequiredAttributes(serverType);

        expect(result).deep.equals(attributes);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWithExactly(connection, Messages.Server.GetRequiredAttributesRequest.type, serverType,
            Common.DEFAULT_TIMEOUT, ErrorMessages.GETREQUIREDATTRIBUTES_TIMEOUT);
    });

    it('getServerTypeOptionalAttributes should delegate to the Common utility', async () => {
        requestStub.resolves(attributes);

        const result = await outgoing.getOptionalAttributes(serverType);

        expect(result).deep.equals(attributes);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWithExactly(connection, Messages.Server.GetOptionalAttributesRequest.type, serverType,
            Common.DEFAULT_TIMEOUT, ErrorMessages.GETOPTIONALATTRIBUTES_TIMEOUT);
    });

    describe('Synchronous Server Creation', () => {
        let stub: sinon.SinonStub;

        describe('from path', () => {
            beforeEach(() => {
                stub = sandbox.stub();
                stub.onFirstCall().resolves([serverBean]);
                stub.onSecondCall().resolves(okStatus);
                connection.sendRequest = stub;
            });

            it('createServerFromPath should send the correct messages', async () => {
                const attrs: Protocol.ServerAttributes = {
                    id: 'id',
                    serverType: serverBean.serverAdapterTypeId,
                    attributes: {
                        'server.home.dir': serverBean.location
                    }
                };
                setTimeout(() => {
                    emitter.emit('serverAdded', serverHandle);
                }, 1);

                const result = await serverCreation.createServerFromPath(discoveryPath.filepath, 'id');

                expect(result).equals(serverHandle);
                expect(stub).calledTwice;
                expect(stub).calledWithExactly(Messages.Server.FindServerBeansRequest.type, discoveryPath);
                expect(stub).calledWithExactly(Messages.Server.CreateServerRequest.type, attrs);
            });

            it('createServerFromPath should register for the correct event and unregister when done', async () => {
                const regSpy = sandbox.spy(emitter, 'prependListener');
                const unregSpy = sandbox.spy(emitter, 'removeListener');

                setTimeout(() => {
                    emitter.emit('serverAdded', serverHandle);
                }, 1);

                await serverCreation.createServerFromPath(discoveryPath.filepath, 'id');

                expect(regSpy).calledOnceWith('serverAdded');
                expect(unregSpy).calledOnceWith('serverAdded');
            });

            it('createServerFromPath should only react to server event with the correct id', async () => {
                const unregSpy = sandbox.spy(emitter, 'removeListener');

                const handle: Protocol.ServerHandle = {
                    id: 'foo',
                    type: serverType
                };

                setTimeout(() => {
                    emitter.emit('serverAdded', handle);
                }, 1);

                try {
                    await serverCreation.createServerFromPath(discoveryPath.filepath, 'id', undefined, 2);
                    expect.fail('Creation finished with the wrong server id');
                } catch (err) {
                    expect(unregSpy).not.called;
                }
            });

            it('createServerFromPath should error on timeout', async () => {
                try {
                    await serverCreation.createServerFromPath(discoveryPath.filepath, 'id', undefined, 1);
                    expect.fail('No error thrown on timeout');
                } catch (err) {
                    expect(err.message).equals(ErrorMessages.CREATESERVER_TIMEOUT);
                }
            });
        });

        describe('from bean', () => {
            const serverHandle1: Protocol.ServerHandle = {
                id: serverBean.name,
                type: serverType
            };

            beforeEach(() => {
                stub = sandbox.stub();
                stub.resolves(okStatus);
                connection.sendRequest = stub;
            });

            it('createServerFromBean should send the correct messages', async () => {
                const attrs: Protocol.ServerAttributes = {
                    id: serverBean.name,
                    serverType: serverBean.serverAdapterTypeId,
                    attributes: {
                        'server.home.dir': serverBean.location
                    }
                };
                setTimeout(() => {
                    emitter.emit('serverAdded', serverHandle1);
                }, 1);

                const result = await serverCreation.createServerFromBean(serverBean);

                expect(result).equals(serverHandle1);
                expect(stub).calledOnce;
                expect(stub).calledWith(Messages.Server.CreateServerRequest.type, attrs);
            });

            it('createServerFromBean should register for the correct event and unregister when done', async () => {
                const regSpy = sandbox.spy(emitter, 'prependListener');
                const unregSpy = sandbox.spy(emitter, 'removeListener');

                setTimeout(() => {
                    emitter.emit('serverAdded', serverHandle1);
                }, 1);

                await serverCreation.createServerFromBean(serverBean);

                expect(regSpy).calledOnceWith('serverAdded');
                expect(unregSpy).calledOnceWith('serverAdded');
            });

            it('createServerFromBean should only react to server event with the correct id', async () => {
                const unregSpy = sandbox.spy(emitter, 'removeListener');

                setTimeout(() => {
                    emitter.emit('serverAdded', serverHandle);
                }, 1);

                try {
                    await serverCreation.createServerFromBean(serverBean, serverBean.name, undefined, 2);
                    expect.fail('Creation finished with the wrong server id');
                } catch (err) {
                    expect(unregSpy).not.called;
                }
            });

            it('createServerFromBean should work with minishift', async () => {
                const bean: Protocol.ServerBean = {
                    fullVersion: '1',
                    location: 'location',
                    name: 'server',
                    serverAdapterTypeId: 'adapter',
                    specificType: 'specificServer',
                    typeCategory: 'MINISHIFT',
                    version: '1'
                };

                const attrs: Protocol.ServerAttributes = {
                    id: serverBean.name,
                    serverType: serverBean.serverAdapterTypeId,
                    attributes: {
                        'server.home.dir': bean.location,
                        'server.home.file': bean.location
                    }
                };
                setTimeout(() => {
                    emitter.emit('serverAdded', serverHandle1);
                }, 1);

                const result = await serverCreation.createServerFromBean(bean);

                expect(result).equals(serverHandle1);
                expect(stub).calledOnceWith(Messages.Server.CreateServerRequest.type, attrs);
            });

            it('createServerFromBean should error on timeout', async () => {
                try {
                    await serverCreation.createServerFromBean(serverBean, 'id', undefined, 1);
                    expect.fail('No error thrown on timeout');
                } catch (err) {
                    expect(err.message).equals(ErrorMessages.CREATESERVER_TIMEOUT);
                }
            });
        });
    });
});
