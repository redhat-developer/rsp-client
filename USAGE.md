# Using the rsp client
There are 3 modules you can import from this package: [Client](#client), [Protocol](#protocol), [ServerState](#serverstate).

## Protocol
Defines the object types used in communication with the server. Some of these objects are also used as parameters or returned by the client methods.
Refer to [this](src/protocol/protocol.ts) file for a complete list of definitions. This should mirror the definitions on the server side [here](https://github.com/redhat-developer/rsp-server/blob/master/schema/src/main/resources/schema/typescript/protocol.unified.d.ts).

## ServerState
Defines constants representing the states a server can be in - including both the state of the server itself and the state of the projects published to the server.
See [here](src/protocol/serverState.ts) for a complete list.

## Client
The main part that takes care of all the communication. Most methods have a timeout by default, can be changed as an optional last parameter (in milliseconds).

Create a new client by using the constructor:
```typescript
const client = new RSPClient('host', port);
```

### Connection Handling
Initiate the connection:
```typescript
client.connect();
```

Disconnect the client:
```typescript
client.disconnect();
```

Shut down the RSP server (and disconnect the client):
```typescript
client.shutdownServer();
```

### Server Discovery
Search a path for suitable servers, resolves to an array of ServerBean objects, see [Protocol](#protocol) for definition:
```typescript
client.findServerBeans('path');
```

Send notification to the RSP to add a directory to its discovery paths. Discovery paths are locations RSP will scan for servers. See [events](#events) for async handling.
```typescript
client.addDiscoveryPathAsync('path');
```

Synchronous version of adding discovery paths, resolves to a DiscoveryPath object, see [Protocol](#protocol) for definition:
```typescript
client.addDiscoveryPathSync('path');
```

Send notification to the RSP to remove a directory from its discovery paths.
```typescript
client.removeDiscoveryPathAsync('path' | path: DiscoveryPath);
```

Synchronous version of removing discovery paths, resolves to a DiscoveryPath object of the path that got removed
```typescript
client.removeDiscoveryPathAsync('path' | path: DiscoveryPath);
```

Get all currently used discovery paths, resolves to an array of DiscoveryPath objects:
```typescript
client.getDiscoveryPaths();
```

### Manipulating Server Model
Send a notification to create a server from a path to its root directory or from a ServerBean object with given id.
See [events](#events) for async handling. Resolves to a Status object, see [Protocol](#protocol) for definition:
```typescript
client.createServerAsync('path' | bean: ServerBean, 'id');
```

Synchronous version of creating a server, resolves to a ServerHandle object:
```typescript
client.createServerSync('path' | bean: ServerBean, 'id');
```

Send a notification to delete a server defined by a ServerHandle:
```typescript
client.deleteServerAsync(serverHandle: ServerHandle);
```

Synchronous version of deleting a server, resolves to the ServerHandle representing the removed server:
```typescript
client.deleteServerSync(serverHandle: ServerHandle);
```

Get handles for all servers, resolves to an array of ServerHandle objects:
```typescript
client.getServerHandles();
```

Get all supported server types, resolves to an array of ServerType objects:
```typescript
client.getServerTypes();
```

Get required or optional attributes of a particular server type, resolves to an Attributes object:
```typescript
client.getServerTypeRequiredAttributes(type: ServerType);
client.getServerTypeOptionalAttributes(type: ServerType);
```

### Launching Servers
Get possible launch modes for a server type, resolves to an array of ServerLaunchMode objects:
```typescript
client.getServerLaunchModes(type: ServerType);
```

Get required or optional launch attributes of a particular server in a particular mode, resolves to an Attributes object:
```typescript
client.getRequiredLaunchAttributes(request: LaunchAttributesRequest);
client.getOptionalLaunchAttributes(request: LaunchAttributesRequest);
```

Get the command usable to manually start a server from cli, resolves to a CommandLineDetails object:
```typescript
client.getServerLaunchCommand(launchParameters: LaunchParameters);
```

Notify RSP that the client is launching / has launched a server manually, resolves to a Status object:
```typescript
client.serverStartingByClient(startingAttributes: ServerStartingAttributes);
client.serverStartingByClient(launchParameters: LaunchParameters);
```

Start a server asynchronously, resolves to a StartServerResponse object. See [events](#events) for async handling:
```typescript
client.startServerAsync(launchParameters: LaunchParameters);
```

Start a server synchronously, resolves to a ServerStateChange object representing the event of server starting up:
```typescript
client.startServerSync(launchParameters: LaunchParameters);
```

Stop a server asynchronously, resolves to a Status object.
```typescript
client.stopServerAsync(stopAttributes: StopServerAttributes);
```

Stop a server synchronously, resolves to a ServerStateChange object representing the event of server stopping:
```typescript
client.stopServerSync(stopAttributes: StopServerAttributes);
```

### Events
The asynchronous methods use several events to handle the response from the server. The client has the following methods to subscribe to these events.

```typescript
// handle adding discovery paths
client.onDiscoveryPathAdded(listener: (arg: DiscoveryPath) => {
    // your logic here
});

// handle removing discovery paths
client.onDiscoveryPathRemoved(listener: (arg: DiscoveryPath) => {
    // your logic here
});

// handle adding servers
client.onServerAdded(listener: (arg: ServerHandle) => {
    // your logic here
});

// handle removing servers
client.onServerRemoved(listener: (arg: ServerHandle) => {
    // your logic here
});

// handle server state changes, useful for starting or stopping servers
client.onServerStateChange(listener: (arg: ServerStateChange) => {
    // your logic here
});

// handle incoming output from a server
client.onServerOutputAppended(listener: (arg: ServerProcessOutput) => {
    // your logic here
});

// handle server's attributes changing
client.onServerAttributeChange(listener: (arg: ServerHandle) => {
    // your logic here
});

// handle server process creation
client.onServerProcessCreated(listener: (arg: ServerProcess) => {
    // your logic here
});

// handle server process termination
client.onServerProcessTerminated(listener: (arg: ServerProcess) => {
    // your logic here
});
```
