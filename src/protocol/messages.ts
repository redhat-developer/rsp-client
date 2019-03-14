import { NotificationType, RequestType } from 'vscode-jsonrpc';
import { Protocol } from './protocol';

/**
 * Message types sent between the RSP server and the client
 */
export namespace Messages {

    /**
     * Server methods
     */
    export namespace Server {
        /**

	 * The `server/getDiscoveryPaths` request is sent by the client to fetch a list
	 * of discovery paths that can be searched.
	 * 
	 * Discovery paths exist in the RSP model as paths suitable to be searched for
	 * server runtime installations. Additional paths may be added via the
	 * `server/addDiscoveryPath` entry point, or removed via the
	 * `server/removeDiscoveryPath` entry point.
	 */
        export namespace GetDiscoveryPaths {
        /**

	 * The `server/findServerBeans` request is sent by the client to fetch a list of
	 * server beans for the given path.
	 * 
	 * The RSP model will iterate through a number of `IServerBeanTypeProvider`
	 * instances and ask them if they recognize the contents of the folder
	 * underlying the discovery path. Any providers that claim to be able to handle
	 * the given path will return an object representing the details of this
	 * recognized server runtime, its version, etc.
	 * 
	 * The path parameter must be an absolute file-system path, and 
	 * may not be a relative path.
	 */
        export namespace FindServerBeans {
        /**

	 * The `server/addDiscoveryPath` request is sent by the client to add a new
	 * path to search when discovering servers. These paths will be stored in a
	 * model, to be queried or searched later by a client.
	 * 
	 * The path parameter must be an absolute file-system path, and 
	 * may not be a relative path.
	 */
        export namespace AddDiscoveryPath {
        /**

	 * The `server/removeDiscoveryPath` request is sent by the client to remove
	 * a path from the model and prevent it from being searched by clients when
	 * discovering servers in the future.
	 * 
	 * The path parameter must be an absolute file-system path, and 
	 * may not be a relative path.
	 */
        export namespace RemoveDiscoveryPath {
        /**

	 * The `server/getServerHandles` request is sent by the client to list the
	 * server adapters currently configured. A server adapter is configured when a
	 * call to `server/createServer` completes without error, or, some may be
	 * pre-configured by the server upon installation.
	 */
        export namespace GetServerHandles {
        /**

	 * Get the state of the current server
	 */
        export namespace GetServerState {
        /**

	 * The `server/getServerTypes` request is sent by the client to list the server
	 * types currently supported. The details of how many server types are supported
	 * by an RSP, or how they are registered, is implementation-specific.
	 */
        export namespace GetServerTypes {
        /**

	 * The `server/deleteServer` request is sent by the client to delete a
	 * server from the model. This server will no longer be able to be started, shut
	 * down, or interacted with in any fashion.
	 */
        export namespace DeleteServer {
        /**

	 * The `server/getRequiredAttributes` request is sent by the client to list the
	 * required attributes that must be stored on a server object of this type, such
	 * as a server-home or other required parameters. This request may return null in
	 * case of error.
	 */
        export namespace GetRequiredAttributes {
        /**

	 * The `server/getOptionalAttributes` request is sent by the client to list the
	 * optional attributes that can be stored on a server object of this type. This
	 * may include things like customizing ports, or custom methods of interacting
	 * with various functionality specific to the server type.This request may return 
	 * null in case of error.
	 */
        export namespace GetOptionalAttributes {
        /**

	 * The `server/createServer` request is sent by the client to create a server in
	 * the model using the given attributes (both required and optional. This
	 * request may fail if required attributes are missing, any attributes 
	 * have impossible, unexpected, or invalid values, or any error occurs
	 * while attempting to create the server adapter as requested.
	 * 
	 * In the event of failure, the returend `Status` object will 
	 * detail the cause of error.   
	 */
        export namespace CreateServer {
        /**

	 * The `server/getLaunchModes` request is sent by the client to get
	 * a list of launch modes that are applicable to this server type. 
	 * Some servers can only be started. 
	 * Others can be started, debugged, profiled, etc. 
	 * 
	 * Server types may come up with their own launch modes if desired.
	 * This method may return null if an error occurs on the server or 
	 * the parameter is invalid.
	 */
        export namespace GetLaunchModes {
        /**

	 * The `server/getRequiredLaunchAttributes` request is sent by the client to get
	 * any additional attributes required for launch or that can customize launch
	 * behavior. Some server types may require references to a specific library, a
	 * clear decision about which of several configurations the server should be
	 * launched with, or any other required details required to successfully start
	 * up the server.
	 * 
	 * This request may return null if the parameter is invalid. 
	 */
        export namespace GetRequiredLaunchAttributes {
        /**

	 * The `server/getOptionalLaunchAttributes` request is sent by the client to get
	 * any optional attributes which can be used to modify the launch behavior. Some
	 * server types may allow overrides to any number of launch flags or settings, 
	 * but not require these changes in order to function.
	 * 
	 * This request may return null if the parameter is invalid. 
	 */
        export namespace GetOptionalLaunchAttributes {
        /**

	 * The `server/getLaunchCommand` request is sent by the client to the server to
	 * get the command which can be used to launch the server.
	 * 
	 * This entry point is most often used if an editor or IDE wishes to start 
	 * the server by itself, but does not know the servertype-specific command
	 * that must be launched. The parameter will include a mode the server
	 * should run in (run, debug, etc), as well as any custom attributes
	 * that may have an effect on the generation of the launch command.
	 * 
	 * This request may return null if the parameter is invalid. 
	 */
        export namespace GetLaunchCommand {
        /**

	 * The `server/serverStartingByClient` request is sent by the client to the
	 * server to inform the server that the client itself has launched the server
	 * instead of asking the RSP to do so.
	 * 
	 * The parameters include both the request used to get the launch command, and a
	 * boolean as to whether the server should initiate the 'state-polling'
	 * mechanism to inform the client when the selected server has completed its
	 * startup.
	 * 
	 * If the `polling` boolean is false, the client is expected to also alert
	 * the RSP when the launched server has completed its startup via the 
	 * `server/serverStartedByClient` request. 
	 */
        export namespace ServerStartingByClient {
        /**

	 * The `server/serverStartedByClient` request is sent by the client to the
	 * server to inform the server that the client itself has launched the server
	 * instead of asking the RSP to do so, AND that the startup has completed.
	 */
        export namespace ServerStartedByClient {
        /**

	 * The `server/startServerAsync` request is sent by the client to the server to
	 * start an existing server in the model.
	 * 
	 * This request will cause the server to launch the server and 
	 * keep organized the spawned processes, their I/O streams, 
	 * and any events that must be propagated to the client. 
	 */
        export namespace StartServerAsync {
        /**

	 * The `server/stopServerAsync` request is sent by the client to the server to
	 * stop an existing server in the model.
	 */
        export namespace StopServerAsync {
        /**
 
	 * Register client capabilities so the server knows what this client can support
	 */
        export namespace RegisterClientCapabilities {
        /**

	 * The `server/getDeployables` request is sent by the client to the server to
	 * get a list of all deployables
	 */
        export namespace GetDeployables {
        /**

	 * The `server/addDeployable` request is sent by the client to the server
	 * to add a deployable reference to a server's list of deployable items
	 * so that it can be published thereafter.
	 * 
	 * @param handle
	 * @param reference
	 * @return
	 */
        export namespace AddDeployable {
        /**

	 * The `server/removeDeployable` request is sent by the client to the server
	 * to remove a deployable reference from a server's list of deployable items
	 * so that it can be unpublished thereafter.
	 * 
	 * @param handle
	 * @param reference
	 * @return
	 */
        export namespace RemoveDeployable {
        /**

	 * The `server/publish` request is sent by the client to the server
	 * to instruct the server adapter to publish any changes to the backing runtime.
	 * 
	 * @param request
	 * @return
	 */
        export namespace Publish {
        /**

	 * Get a list of all downloadable runtimes
	 * @return
	 */
        export namespace ListDownloadableRuntimes {
        /**

	 * Initiate a request to download a runtime
	 * @return
	 */
        export namespace DownloadRuntime {
    }
    /**
     * Client methods
     */
    export namespace Client {
    }
}
