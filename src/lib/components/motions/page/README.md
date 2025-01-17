# Motion Components

These are the pages that are loaded when a given motion is selected. Treat these essentially as pages.

These components are accessed by the `/dashboard/current-motion` route (see that file for more details).

To be used in that route, a component in this folder should be added to the `if/else` block in the `/dashboard/current-motion` route and take a `motion` prop.

This `motion` prop should be declared as so:

```ts
interface Props {
    motion: Motion & { kind: "accepted motion type" | "another accepted motion type" | ... },
    anyOtherProperties: ...
}
let { motion, ... } = $props();
```
