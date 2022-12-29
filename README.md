# libp2p-concurrent-ping

Reproduction of a bug in js-libp2p when concurrently pinging a list of
addresses that includes at least one relay address.

## Reproduction

1. Install

```bash
nvm use
npm install
```

2. Edit `index.js`: Add some p2p addresses in `main()` to ping. Be sure to add
   multiple addresses and include at least one `/p2p-circuit` relay address.

3. Run

```bash
./index.js
```

4. Results

Some of the pings in the `CONCURRENT` section should fail with stream errors.

All of the pings in the `SEQUENTIAL` section should succeed.
