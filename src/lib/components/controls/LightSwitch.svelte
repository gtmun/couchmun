<script lang="ts">
    import { Switch } from '@skeletonlabs/skeleton-svelte';

    import MdiWeatherNight from "~icons/mdi/weather-night";
    import MdiWeatherSunny from "~icons/mdi/weather-sunny";

    interface Props {
      colorScheme: "light" | "dark"
    }
    let { colorScheme = $bindable() }: Props = $props();

    const onCheckedChange = (event: { checked: boolean }) => {
      colorScheme = event.checked ? 'light' : 'dark';
    };
</script>

<Switch
  name="color-scheme"
  checked={colorScheme !== "dark"}
  {onCheckedChange}
>
  <Switch.Control class="bg-indigo-500 data-[state=checked]:bg-yellow-500">
    <Switch.Thumb class="bg-indigo-900 data-[state=checked]:bg-yellow-100">
      <Switch.Context>
          {#snippet children(switch_)}
            {#if switch_().checked}
              <MdiWeatherSunny width="14" height="14" class="text-black" />
            {:else}
              <MdiWeatherNight width="14" height="14" class="text-white" />
            {/if}
          {/snippet}
      </Switch.Context>
    </Switch.Thumb>
  </Switch.Control>
  <Switch.HiddenInput />
</Switch>