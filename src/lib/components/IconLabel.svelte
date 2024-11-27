<!--
    @component
    
    A piece of text that can be replaced with an icon on smaller screens.
-->

<script lang="ts">
    import Icon from "@iconify/svelte";

    interface Props {
        icon: string,
        label: string,
        size?: string,
        iconWidth?: number,
        iconHeight?: number
    }

    let { icon, label, size = "md", iconWidth = 24, iconHeight = 24 }: Props = $props();
</script>

<!-- If on a smaller device, use an icon -->
<div class="flex justify-center items-center {size}:hidden" aria-label={label} title={label}>
    <Icon {icon} width={iconWidth} height={iconHeight} />
</div>
<!-- If on a larger device, use the full text -->
<span class="hidden {size}:block">{label}</span>