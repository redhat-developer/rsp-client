import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as rpc from 'vscode-jsonrpc';
import { Protocol } from '../src/protocol/generated/protocol';
import { Incoming } from '../src/protocol/generated/incoming';
import 'mocha';

const expect = chai.expect;
chai.use(sinonChai);

describe('Capabilities Utility', () => {
    let sandbox: sinon.SinonSandbox;
    let connection: sinon.SinonStubbedInstance<rpc.MessageConnection>;

    let capabilitiesStub: sinon.SinonStubbedInstance<Incoming>;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(rpc, 'createMessageConnection');
        const reader = sandbox.createStubInstance<rpc.StreamMessageReader>(rpc.StreamMessageReader);
        const writer = sandbox.createStubInstance<rpc.StreamMessageWriter>(rpc.StreamMessageWriter);

        connection = sandbox.stub(rpc.createMessageConnection(reader, writer));
        connection.onNotification = sandbox.stub().returns(null);

        capabilitiesStub = sandbox.stub(Incoming.prototype);
        capabilitiesStub.onPromptString.callsArgWith(0, {code: 100, prompt: 'Enter your name'});
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('onStringPrompt listener should be called', async () => {
        const listener = (p: Protocol.StringPrompt): Promise<String> => {
            return Promise.resolve('Joe Doe');

        };
        const listenerSpy = sinon.spy(listener);
        capabilitiesStub.onPromptString(listenerSpy);

        expect(listenerSpy).calledOnce;
    });

});