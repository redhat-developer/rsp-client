import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as rpc from 'vscode-jsonrpc';
import { EventEmitter } from 'events';
import { Messages } from '../src/protocol/generated/messages';
import { Protocol } from '../src/protocol/generated/protocol';
import { Outgoing, ErrorMessages } from '../src/protocol/generated/outgoing';
import { Common } from '../src/util/common';
import 'mocha';

const expect = chai.expect;
chai.use(sinonChai);

describe('Download Runtimes', () => {
    let sandbox: sinon.SinonSandbox;
    let connection: sinon.SinonStubbedInstance<rpc.MessageConnection>;
    let requestStub: sinon.SinonStub;
    let emitter: EventEmitter;
    let outgoing: Outgoing;

    const provideInputStatus: Protocol.Status = {
        code: 0,
        message: 'Please fill the requried information',
        ok: true,
        plugin: 'unknown',
        severity: 1,
        trace: ''
    };
    const wildfly14Runtime: Protocol.DownloadRuntimeDescription = {
        name: 'WildFly 14.0.0 Final',
        id: 'wildfly-1400finalruntime',
        version: '14.0.0.Final',
        url: 'http://download.jboss.org/wildfly/14.0.0.Final/wildfly-14.0.0.Final.zip',
        licenseURL: 'http://www.gnu.org/copyleft/lesser.txt',
        humanUrl: 'http://wildfly.org/downloads/',
        disclaimer: true,
        properties: {
            'wtp-runtime-type': 'org.jboss.ide.eclipse.as.runtime.wildfly.140',
            'runtime-type': 'AS',
            'runtime-category': 'SERVER'
        },
        size: '',
        installationMethod: ''
    };

    const as71Runtime: Protocol.DownloadRuntimeDescription = {
        name: 'JBoss AS 7.1.1 (Brontes)',
        id: 'org.jboss.tools.runtime.core.as.711',
        version: '7.1.1.Final',
        url: 'http://download.jboss.org/jbossas/7.1/jboss-as-7.1.1.Final/jboss-as-7.1.1.Final.zip',
        licenseURL: 'http://www.gnu.org/copyleft/lesser.txt',
        humanUrl: 'http://www.jboss.org/jbossas/downloads',
        disclaimer: true,
        properties: {
            'wtp-runtime-type': 'org.jboss.ide.eclipse.as.runtime.71',
            'runtime-type': 'AS',
            'runtime-category': 'SERVER',
            PROPERTY_ALTERNATE_ID: 'jboss-as711runtime'
        },
        size: '',
        installationMethod: ''
    };

    const downloadableRuntimes: Protocol.ListDownloadRuntimeResponse = {
        runtimes: [
            as71Runtime,
            wildfly14Runtime
        ]
    };

    const downloadWfl14Request: Protocol.DownloadSingleRuntimeRequest = {
        requestId: 0,
        downloadRuntimeId: wildfly14Runtime.id,
        data: {}
    };

    const downloadWf14WorkflowItem: Protocol.WorkflowResponse = {
        status: provideInputStatus,
        requestId: downloadWfl14Request.requestId + 1,
        jobId: '',
        items: [
            {
                id: 'workflow.license',
                itemType: '',
                label: 'Please approve the following license:',
                content: `                   GNU LESSER GENERAL PUBLIC LICENSE
                Version 3, 29 June 2007`,
                responseSecret: false,
                responseType: 'none',
                validResponses: []
            },
            {
                id: 'workflow.license.url',
                itemType: '',
                label: 'License URL: ',
                content: 'http://www.gnu.org/copyleft/lesser.txt',
                responseSecret: false,
                responseType: 'none',
                validResponses: []
            },
            {
                id: 'workflow.license.sign',
                itemType: '',
                label: 'Do you agree to the license?',
                content: '',
                responseSecret: false,
                responseType: 'bool',
                validResponses: []
            }
        ]
    };

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(rpc, 'createMessageConnection');
        const reader = sandbox.createStubInstance<rpc.StreamMessageReader>(rpc.StreamMessageReader);
        const writer = sandbox.createStubInstance<rpc.StreamMessageWriter>(rpc.StreamMessageWriter);

        connection = sandbox.stub(rpc.createMessageConnection(reader, writer));
        connection.onNotification = sandbox.stub().yields();
        emitter = new EventEmitter();
        outgoing = new Outgoing(connection, emitter);
        requestStub = sandbox.stub(Common, 'sendSimpleRequest');
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('listDownloadableRuntimes should send ListDownloadableRuntimesRequest', async () => {
        requestStub.resolves(downloadableRuntimes);

        const result: Protocol.ListDownloadRuntimeResponse = await outgoing.listDownloadableRuntimes();

        expect(result).deep.equals(downloadableRuntimes);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWithExactly(connection, Messages.Server.ListDownloadableRuntimesRequest.type, null,
            Common.LONG_TIMEOUT, ErrorMessages.LISTDOWNLOADABLERUNTIMES_TIMEOUT);
    });

    it('downloadRuntime should send DownloadRuntimeRequest', async () => {
        requestStub.resolves(downloadWf14WorkflowItem);

        const result: Protocol.WorkflowResponse = await outgoing.downloadRuntime(downloadWfl14Request);

        expect(result).deep.equals(downloadWf14WorkflowItem);
        expect(requestStub).calledOnce;
        expect(requestStub).calledWithExactly(connection, Messages.Server.DownloadRuntimeRequest.type, downloadWfl14Request,
            Common.LONG_TIMEOUT, ErrorMessages.DOWNLOADRUNTIME_TIMEOUT);
    });
});
