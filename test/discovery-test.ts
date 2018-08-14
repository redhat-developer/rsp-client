import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as rpc from 'vscode-jsonrpc';
import { Messages } from '../src/protocol/messages';
import { Protocol } from '../src/protocol/protocol';
import { EventEmitter } from 'events';
import { Common, ErrorMessages } from '../src/util/common';
import { Discovery } from '../src/util/discovery';
import 'mocha';

const expect = chai.expect;
chai.use(sinonChai);

describe('Discovery Utility', () => {
    let sandbox: sinon.SinonSandbox;
    let connection: sinon.SinonStubbedInstance<rpc.MessageConnection>;
    let discovery: Discovery;
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
        plugin: 'plugin',
        severity: 0,
        trace: 'trace'
    };

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(rpc, 'createMessageConnection');
        const reader = sandbox.createStubInstance<rpc.StreamMessageReader>(rpc.StreamMessageReader);
        const writer = sandbox.createStubInstance<rpc.StreamMessageWriter>(rpc.StreamMessageWriter);

        connection = sandbox.stub(rpc.createMessageConnection(reader, writer));
        connection.onNotification = sandbox.stub().yields();

        emitter = new EventEmitter();
        discovery = new Discovery(connection, emitter);
        requestStub = sandbox.stub(Common, 'sendSimpleRequest');
        syncStub = sandbox.stub(Common, 'sendRequestSync');
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('findServerBeans should delegate to the Common utility', async () => {
        requestStub.resolves([discoveryPath]);
        const result = await discovery.findServerBeans(discoveryPath.filepath);

        expect(result).deep.equals([discoveryPath]);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWith(connection, Messages.Server.FindServerBeansRequest.type,
            discoveryPath, defaultTimeout, ErrorMessages.FINDBEANS_TIMEOUT);
    });

    it('addDiscoveryPathAsync should delegate to the Common utility', async () => {
        requestStub.resolves(status);
        const result = await discovery.addDiscoveryPathAsync(discoveryPath.filepath);

        expect(result).equals(status);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWith(connection, Messages.Server.AddDiscoveryPathRequest.type, discoveryPath);
    });

    it('addDiscoveryPathSync should delegate to the Common utility', async () => {
        syncStub.resolves(discoveryPath);
        const result = await discovery.addDiscoveryPathSync(discoveryPath.filepath);

        expect(result).equals(discoveryPath);
        expect(syncStub).calledOnce;
        expect(syncStub).calledWith(connection, Messages.Server.AddDiscoveryPathRequest.type, discoveryPath,
            emitter, 'discoveryPathAdded', sinon.match.func, defaultTimeout, ErrorMessages.ADDPATH_TIMEOUT);
    });

    it('removePathAsync should accept string path', async () => {
        requestStub.resolves(status);
        const result = await discovery.removeDiscoveryPathAsync(discoveryPath.filepath);

        expect(result).equals(status);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWith(connection, Messages.Server.RemoveDiscoveryPathRequest.type, discoveryPath);
    });

    it('removePathAsync should accept DiscoveryPath', async () => {
        requestStub.resolves(status);
        const result = await discovery.removeDiscoveryPathAsync(discoveryPath);

        expect(result).equals(status);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWith(connection, Messages.Server.RemoveDiscoveryPathRequest.type, discoveryPath);
    });

    it('removePathSync should accept string path', async () => {
        syncStub.resolves(discoveryPath);
        const result = await discovery.removeDiscoveryPathSync(discoveryPath.filepath);

        expect(result).equals(discoveryPath);
        expect(syncStub).calledOnce;
        expect(syncStub).calledWith(connection, Messages.Server.RemoveDiscoveryPathRequest.type, discoveryPath,
            emitter, 'discoveryPathRemoved', sinon.match.func, defaultTimeout, ErrorMessages.REMOVEPATH_TIMEOUT);
    });

    it('removePathSync should accept DiscoveryPath', async () => {
        syncStub.resolves(discoveryPath);
        const result = await discovery.removeDiscoveryPathSync(discoveryPath);

        expect(result).equals(discoveryPath);
        expect(syncStub).calledOnce;
        expect(syncStub).calledWith(connection, Messages.Server.RemoveDiscoveryPathRequest.type, discoveryPath,
            emitter, 'discoveryPathRemoved', sinon.match.func, defaultTimeout, ErrorMessages.REMOVEPATH_TIMEOUT);
    });

    it('getDiscoveryPaths should delegate to Common utility', async () => {
        requestStub.resolves([discoveryPath]);
        const result = await discovery.getDiscoveryPaths();

        expect(result).deep.equals([discoveryPath]);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWith(connection, Messages.Server.GetDiscoveryPathsRequest.type, null,
            defaultTimeout, ErrorMessages.GETPATHS_TIMEOUT);
    });
});