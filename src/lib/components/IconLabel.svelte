<!--
    @component A text label that is replaced with an icon on smaller screens.
-->

<script lang="ts">
    import type { Component } from "svelte";
    import type { SVGAttributes } from "svelte/elements";

    interface Props {
        /**
         * The icon to use.
         */
        icon: Component<SVGAttributes<SVGSVGElement>>,
        /**
         * The label if the screen is wide enough.
         */
        label: string,
        /**
         * The width of the icon.
         */
        iconWidth?: number,
        /**
         * The height of the icon.
         */
        iconHeight?: number
    }

    let { icon: Icon, label, iconWidth = 24, iconHeight = 24 }: Props = $props();
</script>

<!-- If on a smaller device, use an icon -->
<div class="flex justify-center items-center md:hidden" aria-label={label} title={label}>
    <Icon width={iconWidth} height={iconHeight} />
</div>
<!-- If on a larger device, use the full text -->
<span class="hidden md:block">{label}</span>