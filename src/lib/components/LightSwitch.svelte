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
    controlInactive="bg-indigo-500"
    thumbInactive="bg-indigo-900"
    controlActive="bg-yellow-500"
    thumbActive="bg-yellow-100"
>
    {#snippet inactiveChild()}<MdiWeatherNight width="14" height="14" />{/snippet}
    {#snippet activeChild()}<MdiWeatherSunny width="14" height="14" />{/snippet}
</Switch>