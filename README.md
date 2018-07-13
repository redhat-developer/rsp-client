# ssp-client 
A simple client for the Simple Server Protocol (SSP) written in typescript.

Implements the API described [here](https://github.com/robstryker/org.jboss.tools.ssp/blob/master/api/src/main/java/org/jboss/tools/ssp/api/SSPClient.java) and [here](https://github.com/robstryker/org.jboss.tools.ssp/blob/master/api/src/main/java/org/jboss/tools/ssp/api/SSPServer.java).

See the [SSP repo](https://github.com/robstryker/org.jboss.tools.ssp) for further details about SSP.

## Installing

```sh
npm i ssp-client
```

## Usage
Basic "short" usage example, for full list of available methods, see [usage](USAGE.md).

```typescript
import { SSPClient, Protocol, ServerState } from "ssp-client";

// Use the host and port your SSP server is running on
const client = new SSPClient('localhost', 27511);

// Initiate the connection
await client.connect();

// Find suitable server in a directory and use the serverBeans to create a server called myServer
const serverBeans = await client.findServerBeans('path/to/your/server/root');
const serverHandle = await client.createServerSync(serverBeans[0], 'myServer');

// Alternatively, one can create a server directly from a path
const handle = await client.createServerSync('path/to/server', 'server');

// All 'sync' methods have an async alternative, in order to see when it completes, subscribe to the appropriate event
client.onServerAdded((handle) => {
    console.log(`Server ${handle.id} created`);
});
await client.createServerAsync('path/to/server', 'server');

// Starting a server:
//  subscribe to the server producing output
client.onServerOutputAppended((output) => {
    console.log(output.text);
});

//  subscribe to server state changes to see when it started/stopped
client.onServerStateChange((state) => {
    console.log(`Server state code is ${state.state}`);
    if (state.state === ServerState.STARTED) {
        console.log('Server started');
    } else if (state.state === ServerState.STOPPED) {
        console.log('Server stopped');
    }
});

//  get the starting parameters, we are using the normal run mode here
const attributes = await client.getServerRequiredLaunchAttributes({id: handle.id, mode: 'run'});
const params: Protocol.LaunchParameters = {
    mode: 'run',
    params: {
        id: handle.id,
        serverType: handle.type.id,
        attributes: attributes
    }
};

//  finally start the server
await client.startServerAsync(params);

// Stopping a server, use force at your will
await client.stopServerAsync({ id: handle.id, force: false });

// When all is done you can disconnect the client
client.disconnect();
// or even shut down the entire SSP server instead - don't use disconnect in this case
client.shutdownServer();
```

## Running unit tests

Unit tests are located in `test`. To run all unit tests:

```
npm run test
```

## publish

To publish our module, run the command

```sh
npm publish
```

## Build 

```sh
npm run build
```
