# 1. Match Discord and Stoat channels by name

Date: 2026-09-24

## Status

Accepted

## Context

To forward a Discord message we must decide which Stoat channel it goes to. Stoat generates channel
IDs itself: the create-channel request has no field to set one, so a Discord channel ID cannot be
reused as the Stoat ID.

The natural alternative is to keep a mapping of Discord channel ID to Stoat channel ID. That mapping
must outlive the process, otherwise it is lost on every restart. The application currently keeps
everything in memory and has no persistent storage, so there is nowhere to keep such a mapping.

## Decision

A Discord channel and a Stoat channel are considered the same channel when they have the same name.
`ChannelMigrator` passes `channel.name` to `StoatRepository.sendMessage`, which looks the channel up
by name within the Stoat server. `StoatRepository.createChannel` refuses to create a channel whose
name already exists on the server, so names stay unique on the Stoat side.

## Consequences

- No state has to be stored: the Stoat server is the source of truth for which channels exist.
- Channels with the same name in one Discord server are not supported. Only the first Stoat channel
  with that name is used, and a duplicate cannot be created. This limitation is accepted for now.
- Renaming a channel on either side breaks the match between the two.
- Names must be compatible between the platforms. A name that Stoat rejects or changes will not
  match.

## Revisit when

The application gains persistent storage. A stored Discord ID to Stoat ID mapping would remove the
duplicate-name limitation and the rename problem, and would supersede this decision.
