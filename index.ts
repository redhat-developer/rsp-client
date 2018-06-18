import { SSPClient } from './src/client';
import { EventEmitter } from 'events';
import Protocol from './src/protocol/protocol';
import State from './src/protocol/serverState';

async function clientSetup() {
    const client = new SSPClient('localhost', 27511);

    await client.connect();
    const a = await client.addDiscoveryPathSync('/home/jrichter/Downloads/wildfly-12.0.0.Final')
    const b = await client.getDiscoveryPaths()
    const aa = await client.removeDiscoveryPathSync(a);
    const foo = await client.createServerSync('/home/jrichter/Downloads/wildfly-12.0.0.Final', 'wfly');
    const oof = await client.getServerHandles();
    const ooof = await client.getServerTypeRequiredAttributes(foo.type);
    const oooff = await client.getServerTypeOptionalAttributes(foo.type);

    const fooo = await client.deleteServerSync(foo);

    client.disconnect();
}

clientSetup();
