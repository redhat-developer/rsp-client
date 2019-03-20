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

const expect = chai.expect;
chai.use(sinonChai);

describe('Publishing', () => {
    let sandbox: sinon.SinonSandbox;
    let connection: sinon.SinonStubbedInstance<rpc.MessageConnection>;
    let outgoing: Outgoing;
    let emitter: EventEmitter;


    let requestStub: sinon.SinonStub;

    const okStatus: Protocol.Status = {
        code: 0,
        message: 'ok',
        ok: true,
        plugin: 'unknown',
        severity: 0,
        trace: 'trace'
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

    const modifyDeployableRequest: Protocol.ModifyDeployableRequest = {
        server: serverHandle,
        deployable: deployableReference
    };

    enum PublishKind {
        Incremental,
        Full,
        Clean,
        Auto
    }

    const publishServerRequest: Protocol.PublishServerRequest = {
        server: serverHandle,
        kind: PublishKind.Full
    };

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(rpc, 'createMessageConnection');
        const reader = sandbox.createStubInstance<rpc.StreamMessageReader>(rpc.StreamMessageReader);
        const writer = sandbox.createStubInstance<rpc.StreamMessageWriter>(rpc.StreamMessageWriter);

        connection = sandbox.stub(rpc.createMessageConnection(reader, writer));
        connection.onNotification = sandbox.stub().returns(null);
        emitter = new EventEmitter();
        outgoing = new Outgoing(connection, emitter);
        requestStub = sandbox.stub(Common, 'sendSimpleRequest');
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('getDeployables should send GetDeployablesRequest', async () => {
        const deployableStates: Protocol.DeployableState[] = [deployableState];
        requestStub.resolves(deployableStates);

        const result: Protocol.DeployableState[] = await outgoing.getDeployables(serverHandle);

        expect(result).deep.equals(deployableStates);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWithExactly(connection, Messages.Server.GetDeployablesRequest.type, serverHandle,
            Common.LONG_TIMEOUT, ErrorMessages.GETDEPLOYABLES_TIMEOUT);
    });

    it('addDeployable should send AddDeployableRequest', async () => {
        requestStub.resolves(okStatus);

        const result: Protocol.Status = await outgoing.addDeployable(modifyDeployableRequest);

        expect(result).deep.equals(okStatus);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWithExactly(connection, Messages.Server.AddDeployableRequest.type, modifyDeployableRequest,
            Common.LONG_TIMEOUT, ErrorMessages.ADDDEPLOYABLE_TIMEOUT);
    });

    it('removeDeployable should send RemoveDeployableRequest', async () => {
        requestStub.resolves(okStatus);

        const result: Protocol.Status = await outgoing.removeDeployable(modifyDeployableRequest);

        expect(result).deep.equals(okStatus);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWithExactly(connection, Messages.Server.RemoveDeployableRequest.type, modifyDeployableRequest,
            Common.LONG_TIMEOUT, ErrorMessages.REMOVEDEPLOYABLE_TIMEOUT);
    });

    it('publish should send PublishServerRequest', async () => {
        requestStub.resolves(okStatus);

        const result: Protocol.Status = await outgoing.publish(publishServerRequest);

        expect(result).deep.equals(okStatus);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWithExactly(connection, Messages.Server.PublishRequest.type, publishServerRequest,
            Common.LONG_TIMEOUT, ErrorMessages.PUBLISH_TIMEOUT);
    });
});
