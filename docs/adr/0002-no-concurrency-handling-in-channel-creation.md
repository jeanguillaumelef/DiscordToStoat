# 2. Do not handle concurrent channel creation

Date: 2026-09-24

## Status

Accepted

## Context

`ChannelMigrator.migrateMessage` sends a message and, if Stoat reports `ChannelNotFound`, creates the
channel and sends again (see ADR 1). The check and the create are two separate awaited calls, so the
sequence is not atomic.

If two `migrateMessage` calls for the same missing channel run concurrently, both can receive
`ChannelNotFound` before either has created the channel. Both then call `createChannel`, which can
leave duplicate channels on Stoat. `StoatRepository.createChannel` refuses a name that already
exists, but that check has the same gap: it runs before the other call's create has completed.

A second source of the same problem is someone else creating a channel with the same name on the
Stoat server between our lookup and our create.

A fix is possible: a map of in-flight `createChannel` promises keyed by channel name, so concurrent
callers await one shared create.

## Decision

We do not fix this for now. Handling concurrency adds complexity that is not needed yet:

- The application creates channels on a Stoat server that nobody else is modifying, so there is no
  outside writer to race with.
- Messages are migrated one at a time, each call awaited before the next starts, so our own calls do
  not race either.

`ChannelMigrator.migrateMessage` must therefore not be called concurrently for the same channel.

## Consequences

- The migrator stays simple: no shared state, no promise map.
- Callers must serialize calls, for example with a sequential loop or queue. Using `Promise.all`
  over messages, or firing one unqueued handler per incoming Discord event, would break the
  assumption and can create duplicate channels.
- Duplicates caused by a violation are not detected or repaired. Per ADR 1, only the first channel
  with a given name is used afterwards.
- Serializing calls also keeps messages in order, which a chat mirror needs regardless.

## Revisit when

Messages are migrated in parallel, live Discord events are forwarded without a queue, or the Stoat
server can be modified by others while the application runs. Then add per-channel-name in-flight
tracking, and keep the entry after a successful create so a late caller does not create a second
channel.
