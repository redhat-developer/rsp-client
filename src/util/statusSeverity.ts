import { Protocol } from '../protocol/generated/protocol';

export class StatusSeverity {

    public static isOk(status: Protocol.Status): boolean {
        return status
          && status.severity === 0;
    }

    public static isInfo(status: Protocol.Status): boolean {
        return StatusSeverity.testSeverity(1, status);
    }

    public static isWarning(status: Protocol.Status): boolean {
        return StatusSeverity.testSeverity(2, status);
    }

    public static isError(status: Protocol.Status): boolean {
        return StatusSeverity.testSeverity(4, status);
    }

    public static isCancel(status: Protocol.Status): boolean {
        return StatusSeverity.testSeverity(8, status);
    }

    private static testSeverity(bitmask: number, status: Protocol.Status): boolean {
        return status
          && (status.severity & bitmask) === bitmask;
    }
}
