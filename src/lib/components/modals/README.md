# Modals

These are components for dialog boxes (modals). The main dialog is `ModalContent.svelte`, which holds a simple wrapper component for modals.

This component provides two helper methods for modals to use:

- `submit`: Sends data back up to the parent and closes the modal
- `close`: Cancels the modal action

See the other modal components (labeled `XXCard.svelte`) to see how they wrap `EditModal.svelte`. Note that by default, modals will not have a background. In order to provide a background, the `defaultModalClasses` should be passed to Skeleton's `<Modal>` component.

## Using Modals

To deploy a modal, we can use Skeleton's `<Modal>` component:

```svelte
// Somewhere in the top-level:
import { defaultModalClasses } from "$lib/components/modals/ModalContent.svelte";
import { Modal } from "@skeletonlabs/skeleton-svelte";

<Modal
    bind:open
    triggerBase="btn btn-classes"
    {...defaultModalClasses}
>
    {#snippet trigger()}
        Button Text
    {/snippet}
    {#snippet content()}
        <EtcEtcCard foo={bar} bind:open onSubmit={...}>
    {/snippet}
</Modal>
```
