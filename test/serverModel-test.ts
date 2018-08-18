import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as rpc from 'vscode-jsonrpc';
import { Messages } from '../src/protocol/messages';
import { Protocol } from '../src/protocol/protocol';
import { EventEmitter } from 'events';
import { Common, ErrorMessages } from '../src/util/common';
import { ServerModel } from '../src/util/serverModel';
import 'mocha';

const expect = chai.expect;
chai.use(sinonChai);

describe('Sever Model Utility', () => {
    let sandbox: sinon.SinonSandbox;
    let connection: sinon.SinonStubbedInstance<rpc.MessageConnection>;
    let model: ServerModel;
    let emitter: EventEmitter;
    const defaultTimeout = 2000;

    let requestStub: sinon.SinonStub;
    let syncStub: sinon.SinonStub;

    const discoveryPath: Protocol.DiscoveryPath = {
        filepath: 'path'
    };
    const status: Protocol.Status = {
        code: 0,
        message: 'ok',
        ok: true,
        plugin: 'unknown',
        severity: 0,
        trace: 'trace'
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

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(rpc, 'createMessageConnection');
        const reader = sandbox.createStubInstance<rpc.StreamMessageReader>(rpc.StreamMessageReader);
        const writer = sandbox.createStubInstance<rpc.StreamMessageWriter>(rpc.StreamMessageWriter);

        connection = sandbox.stub(rpc.createMessageConnection(reader, writer));
        connection.onNotification = sandbox.stub().returns(null);

        emitter = new EventEmitter();
        model = new ServerModel(connection, emitter);
        requestStub = sandbox.stub(Common, 'sendSimpleRequest');
        syncStub = sandbox.stub(Common, 'sendRequestSync');
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('createSeverFromPathAsync should delegate to the Common utility', async () => {
        requestStub.onFirstCall().resolves([serverBean]);
        requestStub.onSecondCall().resolves(status);

        const result = await model.createServerFromPathAsync(discoveryPath.filepath, 'id');
        const attributes: Protocol.ServerAttributes = {
            id: 'id',
            serverType: serverBean.serverAdapterTypeId,
            attributes: {
                'server.home.dir': serverBean.location
            }
        };

        expect(result).equals(status);
        expect(requestStub).calledTwice;
        expect(requestStub).calledWithExactly(connection, Messages.Server.FindServerBeansRequest.type, discoveryPath,
            defaultTimeout / 2, ErrorMessages.FINDBEANS_TIMEOUT);
        expect(requestStub).calledWithExactly(connection, Messages.Server.CreateServerRequest.type, attributes,
            defaultTimeout, ErrorMessages.CREATESERVER_TIMEOUT);
    });

    it('createSeverFromBeanAsync should delegate to the Common utility', async () => {
        requestStub.resolves(status);

        const result = await model.createServerFromBeanAsync(serverBean);
        const attributes: Protocol.ServerAttributes = {
            id: serverBean.name,
            serverType: serverBean.serverAdapterTypeId,
            attributes: {
                'server.home.dir': serverBean.location
            }
        };

        expect(result).equals(status);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWithExactly(connection, Messages.Server.CreateServerRequest.type, attributes,
            defaultTimeout, ErrorMessages.CREATESERVER_TIMEOUT);
    });

    it('deleteServerSync should delegate to the Common utility', async () => {
        syncStub.resolves(serverHandle);

        const result = await model.deleteServerSync(serverHandle);

        expect(result).equals(serverHandle);
        expect(syncStub).calledOnce;
        expect(syncStub).calledWith(connection, Messages.Server.DeleteServerRequest.type, serverHandle,
            emitter, 'serverRemoved', sinon.match.func, defaultTimeout, ErrorMessages.DELETESERVER_TIMEOUT);
    });

    it('deleteServerAsync should delegate to the Common utility', async () => {
        requestStub.resolves(status);

        const result = await model.deleteServerAsync(serverHandle);

        expect(result).equals(status);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWith(connection, Messages.Server.DeleteServerRequest.type, serverHandle);
    });

    it('getServerHandles should delegate to the Common utility', async () => {
        requestStub.resolves([serverHandle]);

        const result = await model.getServerHandles();

        expect(result).deep.equals([serverHandle]);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWithExactly(connection, Messages.Server.GetServerHandlesRequest.type, null,
            defaultTimeout, ErrorMessages.GETSERVERS_TIMEOUT);
    });

    it('getServerTypes should delegate to the Common utility', async () => {
        requestStub.resolves([serverType]);

        const result = await model.getServerTypes();

        expect(result).deep.equals([serverType]);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWithExactly(connection, Messages.Server.GetServerTypesRequest.type, null,
            defaultTimeout, ErrorMessages.GETSERVERTYPES_TIMEOUT);
    });

    it('getServerTypeRequiredAttributes should delegate to the Common utility', async () => {
        requestStub.resolves(attributes);

        const result = await model.getServerTypeRequiredAttributes(serverType);

        expect(result).deep.equals(attributes);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWithExactly(connection, Messages.Server.GetRequiredAttributesRequest.type, serverType,
            defaultTimeout, ErrorMessages.GETREQUIREDATTRS_TIMEOUT);
    });

    it('getServerTypeOptionalAttributes should delegate to the Common utility', async () => {
        requestStub.resolves(attributes);

        const result = await model.getServerTypeOptionalAttributes(serverType);

        expect(result).deep.equals(attributes);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWithExactly(connection, Messages.Server.GetOptionalAttributesRequest.type, serverType,
            defaultTimeout, ErrorMessages.GETOPTIONALATTRS_TIMEOUT);
    });

    describe('Synchronous Server Creation', () => {
        let stub: sinon.SinonStub;

        describe('from path', () => {
            beforeEach(() => {
                stub = sandbox.stub();
                stub.onFirstCall().resolves([serverBean]);
                stub.onSecondCall().resolves(status);
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

                const result = await model.createServerFromPath(discoveryPath.filepath, 'id');

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

                await model.createServerFromPath(discoveryPath.filepath, 'id');

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
                    await model.createServerFromPath(discoveryPath.filepath, 'id', 2);
                    expect.fail('Creation finished with the wrong server id');
                } catch (err) {
                    expect(unregSpy).not.called;
                }
            });

            it('createServerFromPath should error on timeout', async () => {
                try {
                    await model.createServerFromPath(discoveryPath.filepath, 'id', 1);
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
                stub.resolves(status);
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

                const result = await model.createServerFromBean(serverBean);

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

                await model.createServerFromBean(serverBean);

                expect(regSpy).calledOnceWith('serverAdded');
                expect(unregSpy).calledOnceWith('serverAdded');
            });

            it('createServerFromBean should only react to server event with the correct id', async () => {
                const unregSpy = sandbox.spy(emitter, 'removeListener');

                setTimeout(() => {
                    emitter.emit('serverAdded', serverHandle);
                }, 1);

                try {
                    await model.createServerFromBean(serverBean, serverBean.name, 2);
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

                const result = await model.createServerFromBean(bean);

                expect(result).equals(serverHandle1);
                expect(stub).calledOnceWith(Messages.Server.CreateServerRequest.type, attrs);
            });

            it('createServerFromBean should error on timeout', async () => {
                try {
                    await model.createServerFromBean(serverBean, 'id', 1);
                    expect.fail('No error thrown on timeout');
                } catch (err) {
                    expect(err.message).equals(ErrorMessages.CREATESERVER_TIMEOUT);
                }
            });
        });
    });
});