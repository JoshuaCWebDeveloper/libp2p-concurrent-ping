#!/usr/bin/env node

import { noise } from '@chainsafe/libp2p-noise';
import { mplex } from '@libp2p/mplex';
import { webSockets } from '@libp2p/websockets';
import { createLibp2p } from 'libp2p';
import { multiaddr } from '@multiformats/multiaddr';

export const createNode = async () => {
    const node = await createLibp2p({
        transports: [webSockets()],
        connectionEncryption: [noise()],
        streamMuxers: [mplex()],
        connectionManager: {
            dialTimeout: 60000,
            autoDial: false,
        },
    });

    node.connectionManager.addEventListener('peer:connect', evt => {
        const connection = evt.detail;
        console.log(`Connected to ${connection.remotePeer.toString()}`);
        // console.log(connection);
    });

    node.connectionManager.addEventListener('peer:disconnect', evt => {
        const connection = evt.detail;
        console.log(`disconnected from ${connection.remotePeer.toString()}`);
        // console.log(connection);
    });

    node.addEventListener('peer:discovery', evt => {
        console.log('peer:discovery', evt);
    });

    return node;
};

export const withNode = async (fn, existingNode) => {
    const node = existingNode ?? (await createNode());
    await node.start();
    console.log(`Node started with id ${node.peerId.toString()}`);
    await fn(node);
    await node.stop();
};

export const pingAddress = async (node, argv) => {
    let conn;
    try {
        conn = await node.ping(multiaddr(argv.multiaddr));
    } catch (e) {
        console.log('Error pinging address: ', e);
        return;
    }

    console.log('Successfully pinged address: ' + argv.multiaddr);
    console.log('Latency: ' + conn + 'ms');
};

const concurrent = async (node, addresses) => {
    return Promise.all(
        addresses.map(async address => {
            await pingAddress(node, { multiaddr: address });
        })
    );
};

const sequential = async (node, addresses) => {
    for (const address of addresses) {
        await pingAddress(node, { multiaddr: address });
    }
};

const main = async () => {
    const addresses = [
        // LIST OF ADDRESSES TO PING HERE
        // '/dns4/localhost/tcp/8080/ws/p2p/ABCD1234',
        //
        // LIST OF /p2p-circuit RELAY ADDRESSES TO PING HERE
        // '/dns4/localhost/tcp/8080/ws/p2p/ABCD1234/p2p-circuit/p2p/WXYZ6789',
        //
    ];

    withNode(async node => {
        try {
            console.log('\n', '*** CONCURRENT ***', '\n');
            await concurrent(node, addresses);
        } catch (e) {
            console.log('Error pinging addresses concurrently: ', e);
        }
        try {
            console.log('\n', '*** SEQUENTIAL ***', '\n');
            await sequential(node, addresses);
        } catch (e) {
            console.log('Error pinging addresses sequentially: ', e);
        }
    });
};

await main();
