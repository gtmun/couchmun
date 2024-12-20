<script lang="ts">
    import DelFlag from "$lib/components/del-label/DelFlag.svelte";
    import type { DelegateAttrs } from "$lib/types";
    import { cubicOut } from "svelte/easing";
    import { type TransitionConfig } from "svelte/transition";

    interface Props {
        key: string;
        attrs: DelegateAttrs | undefined;
        height?: string | undefined;
        inline?: boolean;
        fallback?: "un" | "icon" | "none" | undefined;
    }

    let {
        key,
        attrs,
        height = undefined,
        inline = false,
        fallback = undefined
    }: Props = $props();

    let label = $derived(attrs?.name ?? key ?? "");

    /**
     * Variant of slide transition which lazily computes the style properties when needed.
     * 
     * The benefit of this is that it computes width/height *after* images load, 
     * meaning they will properly be accounted for in transition calculations.
     * 
     * This code is based on https://github.com/sveltejs/svelte/blob/1d773ef3a471adb36eb3c992168b21fbaf349562/packages/svelte/src/transition/index.js#L102C1-L136C2,
     * reducing it to only width/height and padding properties,
     * as well as implementing delayed style computation.
     */
    function lazyslide(node: HTMLElement, { delay = 0, duration = 400, easing = cubicOut, axis = 'y' } = {}) {
        let style: CSSStyleDeclaration | undefined = undefined;
        const dimProperty = axis === 'y' ? 'height' : 'width';
        const padProperty = axis === 'y' ? ['paddingTop', 'paddingBottom'] as const : ['paddingLeft', 'paddingRight'] as const;
        let dimValue: number | undefined = undefined;
        let padTLValue: number | undefined = undefined;
        let padBRValue: number | undefined = undefined;

        return {
            delay,
            duration,
            easing,
            css: (t) => {
                if (t > 0 && typeof dimValue === "undefined") {
                    style = getComputedStyle(node);
                    dimValue = parseFloat(style[dimProperty]);
                    padTLValue = parseFloat(style[padProperty[0]]);
                    padBRValue = parseFloat(style[padProperty[1]]);
                }

                return 'overflow: hidden; ' +
                    `${dimProperty}: ${t * (dimValue ?? 0)}px;` +
                    `${padProperty[0]}: ${t * (padTLValue ?? 0)}px;` +
                    `${padProperty[1]}: ${t * (padBRValue ?? 0)}px;`;
            }
        } satisfies TransitionConfig;
    }
</script>

{#if inline}
<div class="flex items-center gap-1">
    <DelFlag {key} {attrs} height={height ?? "h-4"} fallback={fallback ?? "none"} inline />
    <span class="text-left">{label}</span>
</div>
{:else}
    {#key key}
    <div class="flex flex-col items-center gap-3 pb-5" transition:lazyslide|global>
        <h2 class="h2">{label}</h2>
        <DelFlag {key} {attrs} height={height ?? "h-[25dvh]"} fallback={fallback ?? "un"} />
    </div>
    {/key}
{/if}