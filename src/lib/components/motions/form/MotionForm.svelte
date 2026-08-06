<!--
  @component A component that wraps around the form used 
    to create or edit a motion.
-->
<script lang="ts">
    import { type Snippet } from 'svelte';
    import { slide } from 'svelte/transition';
    import type { z } from "zod";

    import DelCombobox from "$lib/components/controls/DelCombobox.svelte";
    import { getSessionContext } from "$lib/context/index.svelte";
    import { MOTION_BASE_FIELDS, MOTION_DEFS, MOTION_GROUP_LABELS, type FieldProperties, type MotionSchema } from "$lib/motions/definitions";
    import { formatValidationError } from "$lib/motions/form_validation";
    import { getComponent } from '$lib/motions/input';
    import type { MotionInput } from "$lib/motions/types";
    import type { DelegateID, Motion } from "$lib/types";
    import { hasKey, NO_FIGURE } from "$lib/util";
    import { proxify } from '$lib/util/sv.svelte';
    import { parseTime } from "$lib/util/time";
    import MdiPlus from "~icons/mdi/plus";


    const { selectedMotion, delegates, enabledMotions } = getSessionContext();
    const defaultInputMotion = () => ({ id: crypto.randomUUID(), kind: "mod" } satisfies MotionInput);

    interface Props {
        /**
         * Any prefilled input data.
         */
        initialInput?: MotionInput;
        /**
         * The motion validation schema.
         */
        motionSchema: MotionSchema,
        /**
         * A callback where the motion is submitted 
         * if it is successfully validated and produced.
         */
        submit: (m: Motion) => void;
        /**
         * Buttons on the bottom of the snippet.
         * If not specified, this will just be an "Add Motion" button.
         */
        buttons?: Snippet;
    }
    let {
        initialInput = undefined,
        motionSchema,
        submit,
        buttons
    }: Props = $props();
    
    // Deeply-reactive derived
    let inputMotion = $derived(proxify<MotionInput>(initialInput ?? defaultInputMotion()));
    let inputDel = $state<DelegateID>();
    // Any input validation errors.
    let inputError = $state<z.core.$ZodIssue>();
    // The form element.
    let formEl = $state<HTMLFormElement>();
    
    const motionDef = $derived(MOTION_DEFS[inputMotion.kind]);
    
    let dropdownMotions = $derived.by(() => {
        type GroupLabel = keyof typeof MOTION_GROUP_LABELS;

        let filters: Record<string, boolean | undefined> = $enabledMotions;
        let motions = Object.entries<{ label: string, group?: GroupLabel }>(MOTION_DEFS)
            .filter(([kind, _]) => filters[kind] ?? true)
            .map(([kind, { label, group }]) => ({ kind, label, group }));
        
        return Map.groupBy(motions, ({ group }) => group);
    });
    
    function defHasFields(...keys: string[]) {
        return keys.every(k => hasKey(motionDef.fields, k));
    }
    function defAccepts(key: string) {
        return (MOTION_BASE_FIELDS as readonly string[]).includes(key)
            || defHasFields(key);
    }
    // Motion validation and submission.
    function submitMotion(e: SubmitEvent) {
        e.preventDefault();

        // Filter out any keys that aren't the correct kind:
        let im_: Record<string, unknown> = inputMotion;
        for (let key of Object.keys(inputMotion)) {
            if (!defAccepts(key)) {
                delete im_[key];
            }
        }
        if ($selectedMotion?.kind !== im_.kind) {
            delete im_["isExtension"];
        }
        // Validate input
        const result = motionSchema.safeParse(inputMotion);
        if (result.success) {
            // HACK: Needed b.c. inputMotion is a deeply-reactive derived
            inputMotion = proxify(defaultInputMotion());
            inputDel = undefined;
            inputError = undefined;

            submit?.(result.data);
            // Refocus to top of form:
            (formEl?.children[0] as HTMLElement)?.focus();
        } else {
            inputError = formatValidationError(result.error);
        }
    }

    // Extension handling.
    function isExtending(m: MotionInput): boolean {
        return m.kind === $selectedMotion?.kind && (m as any).isExtension;
    }

    // If extension, disable "topic" and "speakingTime":
    $effect(() => {
        if (isExtending(inputMotion)) {
            let inputified = motionSchema.encode($selectedMotion!);
            
            if (hasKey(inputified, "topic")) (inputMotion as any).topic = inputified.topic;
            if (hasKey(inputified, "speakingTime")) (inputMotion as any).speakingTime = inputified.speakingTime;
        }
    });
</script>

<script lang="ts" module>
    /**
     * Calculates the number of speakers string.
     * @param totalTime The total time in seconds (or as a time-formatted string)
     * @param speakingTime The speaking time in seconds (or as a time-formatted string)
     * @returns the number of speakers string, or undefined if either are undefined
     */
    export function numSpeakersStr(totalTime: number | string | undefined, speakingTime: number | string | undefined): string | undefined {
        // Parse arguments as either seconds or time string.
        if (typeof totalTime === "string") totalTime = parseTime(totalTime);
        if (typeof speakingTime === "string") speakingTime = parseTime(speakingTime);

        // Handle undefined cases
        if (typeof totalTime === "undefined") return;
        if (typeof speakingTime === "undefined") return;
        
        let nSpeakers = totalTime / speakingTime;
        // Simple validation
        if (!Number.isFinite(nSpeakers)) return;
        if (nSpeakers < 0) return;
        if (!Number.isInteger(nSpeakers)) return nSpeakers.toFixed(2);
        return nSpeakers.toString();
    }
</script>

<form 
    onsubmit={submitMotion}
    oninput={() => inputError = undefined}
    class="flex flex-col gap-3 p-3 [&>label>*]:transition-colors"
    bind:this={formEl}
>
    <!-- Delegate input -->
    <label class="label">
        <span>Delegate</span>
        <DelCombobox
            bind:input={inputMotion.delegate}
            bind:value={inputDel}
            delegates={$delegates}
            onSelect={() => {
                // Once selected, move to next item in form
                setTimeout(() => {
                    (formEl?.children[1] as HTMLElement)?.focus?.()
                });
            }}
            error={inputError?.path.includes("delegate")}
            selectOnBlur
        />
    </label>

    <!-- Motion dropdown -->
    <label class="label">
        <span>Motion</span>
        <select 
            class={["select", inputError?.path.includes("kind") && "preset-input-error"]}
            bind:value={inputMotion.kind}
        >
            {#snippet spreadOptions(options: { kind: string, label: string }[])}
                {#each options as { kind, label } (kind)}
                    <option value={kind} {label}></option>
                {/each}
            {/snippet}
            {#each dropdownMotions as [group, options] (group)}
                {#if group}
                    <optgroup label={MOTION_GROUP_LABELS[group]}>{@render spreadOptions(options)}</optgroup>
                {:else}
                    {@render spreadOptions(options)}
                {/if}
            {/each}
        </select>
    </label>

    {#each Object.entries<FieldProperties>(motionDef.fields) as [name, {input, schema: _schema, ...args}] (name)}
        {@const Component = getComponent(input, { inputKind: inputMotion.kind, prevMotionKind: $selectedMotion?.kind, extEnabled: $enabledMotions.ext ?? true })}

        {#if Component}
            <Component
                {name}
                error={inputError?.path.includes(name)}
                bind:value={(inputMotion as any)[name]}
                isExtending={isExtending(inputMotion)}
                motion={$selectedMotion}
                {...args}
            />
        {/if}
    {/each}

    <!-- Number of speakers display -->
    {#if defHasFields("totalTime", "speakingTime")}
        {@const im_: Record<"totalTime" | "speakingTime", number | string | undefined> = inputMotion as any}
        <div class="text-center">
            <strong>Number of speakers</strong>: {numSpeakersStr(im_.totalTime, im_.speakingTime) ?? NO_FIGURE}
        </div>
    {/if}

    <!-- End buttons -->
    {#if buttons}
        {@render buttons()}
    {:else}
        <button 
            class="btn preset-filled-primary-500" 
            type="submit"
        >
            <MdiPlus />
            Add Motion
        </button>
    {/if}

    {#if typeof inputError !== "undefined"}
        <div 
            class="text-error-500 text-center"
            role="alert"
            transition:slide={{ duration: 150 }}
        >
            {inputError.message}
        </div>
    {/if}
</form>