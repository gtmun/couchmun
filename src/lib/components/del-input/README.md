# Delegate Input Components

Components relating to text input for delegates. This folder consists of:

- `DelAutocomplete`: A small component that displays the list of suggested delegate options.
- `DelPopup`: A popup wrapper encapsulating a `DelAutocomplete` component

These components allow a suggestion popup to display next to a delegate `<input>`, allowing directors to quickly fill in the name of delegates.

## Usage

To bind a `DelPopup` element to an `<input>` element, there are a few steps:

1. Declare a `<DelPopup>` component near the bottom of the page (any element that follows `<DelPopup>` can cover the popup, so it has to be near the end. Increasing `z-index` does not fix this).
2. Bind `delegates` props of `<DelPopup>` to a list of delegates. These can typically be bound to the `$delegates` store, which can be generated from the delegates database with `enabledDelegatesStore(.)`.
3. Bind the `<DelPopup>` component's `input` prop to the same value as the `<input>` element's `value` prop
4. Set `on:selection` to update the `input` variable in `<DelPopup>` to `e.detail.label`
5. use the [Skeleton UI popup action](https://www.skeleton.dev/utilities/popups) on the `input` prop, matching the `target` setting to the `<DelPopup>` component's `popupID` prop.

`DelPopup` also provides two utility functions that can be used to reduce the amount of settings that need to be configured:

- `defaultPopupSettings(popupId: string)`: Creates a default popup configuration to be used for the `popup` action (see #3)
- `defaultPlaceholder(noDelegatesPresent)`: Declares an object to automatically handle `disabled` and `placeholder` props.

The bindings should look similar to this:

```svelte
<script lang="ts">
    import DelPopup, { defaultPlaceholder, defaultPopupSettings } from "$lib/components/del-input/DelPopup.svelte";
    
    let inputValue: string;
    let delegates = enabledDelegatesStore(db.delegates);
    let noDelegatesPresent = $derived(delegates.every(d => !d.isPresent()));
</script>

<!-- ... -->

<input 
  class="input"
  bind:value={inputValue}
  use:popup={defaultPopupSettings("delegatePopup")}
  {...defaultPlaceholder(noDelegatesPresent)}
>

<!-- ... -->
 
<DelPopup
  popupID="delegatePopup"
  bind:input={inputValue}
  delegates={$delegates}
  on:selection={e => inputValue = e.detail.label}
/>
```
