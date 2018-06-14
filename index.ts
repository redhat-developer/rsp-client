import Client from './src/client';
import {EventEmitter} from 'events';
import Protocol from './src/protocol/protocol';
import State from './src/protocol/serverState';

async function clientSetup() {
    const client = new Client('localhost', 27511);

    await client.connect();
    
    const handle = await client.createServer("/home/jrichter/Downloads/wildfly-12.0.0.Final", 'wfly');

    client.onServerStateChange(async (state) => {
        if (state.server.id === handle.id) {
            if (state.state === State.STARTING) {
                // console.log('it is starting')
            } else if (state.state === State.STARTED) {
                const baaz = await client.stopServerAsync({id: handle.id, force: false});
            } else if (state.state === State.STOPPING) {
                // console.log('it is stopping')
            } else if (state.state === State.STOPPED) {
                const f00 = await client.deleteServer(handle);
                const bar2 = await client.getServerHandles();
                client.disconnect();
            }
        }
    });
    client.onServerOutputAppended((output) => {
        console.log(output.text);
    });
    client.onServerProcessCreated((process) => {
        console.log('Created process: ' + process.processId);
    });
    client.onServerProcessTerminated((process) => {
        console.log('Terminated process: ' + process.processId);
    });

    
    const baz = await client.startServerAsync(
        {mode: 'run',
         params: {
            serverType: handle.type.id,
            id: handle.id,
            attributes: await client.getServerRequiredLaunchAttributes({id: handle.id, mode: 'run'})
            }
         });
}

clientSetup();
