# Modals

These are components for dialog boxes (modals), particularly for dialog boxes that perform some sort of complex action.

The main dialog is `EditModal.svelte`, which holds a simple wrapper component for modals.

This component wraps data in a card form (so there is a background for each modal), and provides two helper methods for modals to use:

- `submit`: Sends data back up to the parent and closes the modal
- `close`: Cancels the modal action

See the other modal components (labeled `EtcEtcCard.svelte`) to see how they wrap `EditModal.svelte`.

## Using Modals

To deploy a modal, we can use Skeleton's `modalStore.trigger`:

```ts
// Somewhere in the top-level:
import { getModalStore } from "@skeletonlabs/skeleton";
const modalStore = getModalStore();

// Where the modal is triggered:
modalStore.trigger({
    type: "component",
    component: {
        ref: EtcEtcCard,
        props: ... // props into EtcEtcCard
    },
    response(data?: SubmitData) {
        if (!data) return;

        // Handle a submit request:
        // ...
    }
})
```

If you're handling a simple confirm (yes/no) modal, it may be simpler to instead use `triggerConfirmModal` from `$lib/util`.
