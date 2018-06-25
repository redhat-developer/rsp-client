/**
 * Constants representing the state of the server itself or the state of publishing to the server
 */
export namespace ServerStatus {

    /**
	 * Server state constant (value 0) indicating that the
	 * server is in an unknown state.
	 */
    export const UNKNOWN = 0;

    /**
	 * Server state constant (value 1) indicating that the
	 * server is starting, but not yet ready to serve content.
	 */
    export const STARTING = 1;

    /**
	 * Server state constant (value 2) indicating that the
	 * server is ready to serve content.
	 */
    export const STARTED = 2;

    /**
	 * Server state constant (value 3) indicating that the
	 * server is shutting down.
	 */
    export const STOPPING = 3;

    /**
	 * Server state constant (value 4) indicating that the
	 * server is stopped.
	 */
    export const STOPPED = 4;

    /**
	 * Publish state constant (value 0) indicating that it's
	 * in an unknown state.
	 */
    export const PUBLISH_STATE_UNKNOWN = 0;

    /**
	 * Publish state constant (value 1) indicating that there
	 * is no publish required.
	 */
    export const PUBLISH_STATE_NONE = 1;

    /**
	 * Publish state constant (value 2) indicating that an
	 * incremental publish is required.
	 */
    export const PUBLISH_STATE_INCREMENTAL = 2;

    /**
	 * Publish state constant (value 3) indicating that a
	 * full publish is required.
	 */
    export const PUBLISH_STATE_FULL = 3;

    /**
	 * Publish kind constant (value 1) indicating an incremental publish request.
	 */
    export const PUBLISH_INCREMENTAL = 1;

    /**
	 * Publish kind constant (value 2) indicating a full publish request.
	 */
    export const PUBLISH_FULL = 2;

    /**
	 * Publish kind constant (value 3) indicating an automatic publish request.
	 */
    export const PUBLISH_AUTO = 3;

    /**
	 * Publish kind constant (value 4) indicating a publish clean request
	 */
    export const PUBLISH_CLEAN = 4;
}