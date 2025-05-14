<script lang="ts">
    import { Switch } from '@skeletonlabs/skeleton-svelte';
    import MdiWeatherNight from "~icons/mdi/weather-night";
    import MdiWeatherSunny from "~icons/mdi/weather-sunny";

    let checked = $state(false);
    $effect(() => {
      const mode = localStorage.getItem('color-scheme') === "dark" ? "dark" : 'light';
      checked = mode === 'light';
    });
  
    const onCheckedChange = (event: { checked: boolean }) => {
      const mode = event.checked ? 'light' : 'dark';

    if (mode == "dark") {
        document.documentElement.classList.add("dark");
    } else if (mode == "light") {
        document.documentElement.classList.remove("dark");
    }
      localStorage.setItem('color-scheme', mode);
      checked = event.checked;
    };
</script>

<Switch
    name="color-scheme"
    {checked}
    {onCheckedChange}
    controlInactive="bg-indigo-500"
    thumbInactive="bg-indigo-900"
    controlActive="bg-yellow-500"
    thumbActive="bg-yellow-100"
>
    {#snippet inactiveChild()}<MdiWeatherNight width="14" height="14" />{/snippet}
    {#snippet activeChild()}<MdiWeatherSunny width="14" height="14" />{/snippet}
</Switch>