# Stores

This folder defines stores, which handle cross-page and cross-refresh information.

- `index.ts`: Boilerplate that allows stores to be created.
- `session.ts`: Session data store
- `settings.ts`: Settings store

A given store can be created by calling the `createXXContext` function of a given store module in the top level of a `+layout.svelte` file. (For example, `createSessionDataContext` from `session.ts` is called in the top level of `dashboard/+layout.svelte`).

If you wish to see the internals of how this is implemented, check out `index.ts`.
