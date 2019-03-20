import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import { Protocol } from '../src/protocol/generated/protocol';
import { StatusSeverity } from '../src/util/statusSeverity';

const expect = chai.expect;
chai.use(sinonChai);

describe('status severity', () => {

    class TestStatus implements Protocol.Status {
        severity: number;
        message: string;
        trace: string;
        plugin: string;
        code: 0;
        ok: true;

        constructor(severity: number) {
            this.severity = severity;
        }
    }

    const okStatus: Protocol.Status = new TestStatus(0);
    const infoStatus: Protocol.Status = new TestStatus(1);
    const warningStatus: Protocol.Status = new TestStatus(2);
    const errorStatus: Protocol.Status = new TestStatus(4);
    const cancelErrorStatus: Protocol.Status = new TestStatus(4 | 8);

    it('should be ok severity', () => {
        expect(StatusSeverity.isOk(okStatus)).to.be.true;
        expect(StatusSeverity.isError(okStatus)).to.be.false;
        expect(StatusSeverity.isWarning(okStatus)).to.be.false;
        expect(StatusSeverity.isInfo(okStatus)).to.be.false;
        expect(StatusSeverity.isCancel(okStatus)).to.be.false;
    });

    it('should be error severity', () => {
        expect(StatusSeverity.isOk(errorStatus)).to.be.false;
        expect(StatusSeverity.isError(errorStatus)).to.be.true;
        expect(StatusSeverity.isWarning(errorStatus)).to.be.false;
        expect(StatusSeverity.isInfo(errorStatus)).to.be.false;
        expect(StatusSeverity.isCancel(errorStatus)).to.be.false;
    });

    it('should be info severity', () => {
        expect(StatusSeverity.isOk(infoStatus)).to.be.false;
        expect(StatusSeverity.isError(infoStatus)).to.be.false;
        expect(StatusSeverity.isWarning(infoStatus)).to.be.false;
        expect(StatusSeverity.isInfo(infoStatus)).to.be.true;
        expect(StatusSeverity.isCancel(infoStatus)).to.be.false;
    });

    it('should be warning severity', () => {
        expect(StatusSeverity.isOk(warningStatus)).to.be.false;
        expect(StatusSeverity.isError(warningStatus)).to.be.false;
        expect(StatusSeverity.isWarning(warningStatus)).to.be.true;
        expect(StatusSeverity.isInfo(warningStatus)).to.be.false;
        expect(StatusSeverity.isCancel(warningStatus)).to.be.false;
    });

    it('should be cancel & error severity', () => {
        expect(StatusSeverity.isOk(cancelErrorStatus)).to.be.false;
        expect(StatusSeverity.isError(cancelErrorStatus)).to.be.true;
        expect(StatusSeverity.isWarning(cancelErrorStatus)).to.be.false;
        expect(StatusSeverity.isInfo(cancelErrorStatus)).to.be.false;
        expect(StatusSeverity.isCancel(cancelErrorStatus)).to.be.true;
    });

});
