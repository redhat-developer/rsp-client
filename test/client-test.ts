import * as chai from 'chai';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import { SSPClient } from '../src/client';

const expect = chai.expect;
chai.use(sinonChai);

describe('SSP Client', () => {
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('does something', () => {
        const client = new SSPClient('aa', 222);
        sandbox.stub(client);
        expect(1 + 1).to.equal(2);
    });
});