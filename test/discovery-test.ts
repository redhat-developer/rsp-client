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

const expect = chai.expect;
chai.use(sinonChai);

describe('Discovery Utility', () => {
    let sandbox: sinon.SinonSandbox;
    let connection: sinon.SinonStubbedInstance<rpc.MessageConnection>;
    let outgoing: Outgoing;
    let outgoingSync: OutgoingSynchronous;
    let emitter: EventEmitter;

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
        outgoing = new Outgoing(connection);
        outgoingSync = new OutgoingSynchronous(connection, emitter);
        requestStub = sandbox.stub(Common, 'sendSimpleRequest');
        syncStub = sandbox.stub(Common, 'sendRequestSync');
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('findServerBeans should delegate to the Common utility', async () => {
        requestStub.resolves([discoveryPath]);
        const result = await outgoing.findServerBeans(discoveryPath);

        expect(result).deep.equals([discoveryPath]);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWith(connection, Messages.Server.FindServerBeansRequest.type,
            discoveryPath, Common.DEFAULT_TIMEOUT, ErrorMessages.FINDSERVERBEANS_TIMEOUT);
    });

    it('addDiscoveryPathAsync should delegate to the Common utility', async () => {
        requestStub.resolves(status);
        const result = await outgoing.addDiscoveryPath(discoveryPath);

        expect(result).equals(status);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWith(connection, Messages.Server.AddDiscoveryPathRequest.type, discoveryPath);
    });

    it('addDiscoveryPathSync should delegate to the Common utility', async () => {
        syncStub.resolves(discoveryPath);
        const result = await outgoingSync.addDiscoveryPathSync(discoveryPath.filepath);

        expect(result).equals(discoveryPath);
        expect(syncStub).calledOnce;
        expect(syncStub).calledWith(connection, Messages.Server.AddDiscoveryPathRequest.type, discoveryPath,
            emitter, 'discoveryPathAdded', sinon.match.func, Common.DEFAULT_TIMEOUT, ErrorMessages.ADDDISCOVERYPATH_TIMEOUT);
    });

    it('removePathAsync should accept DiscoveryPath', async () => {
        requestStub.resolves(status);
        const result = await outgoing.removeDiscoveryPath(discoveryPath);

        expect(result).equals(status);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWith(connection, Messages.Server.RemoveDiscoveryPathRequest.type, discoveryPath);
    });

    it('removePathSync should accept DiscoveryPath', async () => {
        syncStub.resolves(discoveryPath);
        const result = await outgoingSync.removeDiscoveryPathSync(discoveryPath);

        expect(result).equals(discoveryPath);
        expect(syncStub).calledOnce;
        expect(syncStub).calledWith(connection, Messages.Server.RemoveDiscoveryPathRequest.type, discoveryPath,
            emitter, 'discoveryPathRemoved', sinon.match.func, Common.DEFAULT_TIMEOUT, ErrorMessages.REMOVEDISCOVERYPATH_TIMEOUT);
    });

    it('getDiscoveryPaths should delegate to Common utility', async () => {
        requestStub.resolves([discoveryPath]);
        const result = await outgoing.getDiscoveryPaths();

        expect(result).deep.equals([discoveryPath]);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWith(connection, Messages.Server.GetDiscoveryPathsRequest.type, null,
            Common.DEFAULT_TIMEOUT, ErrorMessages.GETDISCOVERYPATHS_TIMEOUT);
    });
});