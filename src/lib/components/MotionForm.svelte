<script lang="ts">
    import LabeledSlideToggle from "$lib/components/LabeledSlideToggle.svelte";
    import DelPopup, { defaultPlaceholder, defaultPopupSettings } from "$lib/components/del-input/DelPopup.svelte";
    import { createMotionSchema, inputifyMotion, MOTION_FIELDS, MOTION_LABELS } from "$lib/motions/definitions";
    import { formatValidationError } from "$lib/motions/form_validation";
    import type { MotionInput, MotionInputWithFields } from "$lib/motions/types";
    import { getSessionDataContext } from "$lib/stores/session";
    import { addColons, parseTime } from "$lib/util/time";
    import type { Motion } from "$lib/types";
    
    import type { z } from "zod";
    import { popup } from "@skeletonlabs/skeleton";

    const { settings: { delegateAttributes }, presentDelegates, selectedMotion } = getSessionDataContext();
    const motionSchema = createMotionSchema($delegateAttributes, $presentDelegates);
    const defaultInputMotion = () => ({ kind: "mod" } satisfies MotionInput);
    const resetInputErrors = () => { inputError = undefined };

    export let inputMotion: MotionInput = defaultInputMotion();
    export let submit: (m: Motion) => void;
    let inputError: z.ZodIssue | undefined = undefined;

    // The input after the delegate input.
    let afterDel: HTMLElement;

    function submitMotion() {
        const result = motionSchema.safeParse(inputMotion);
        if (result.success) {
            inputMotion = defaultInputMotion();
            inputError = undefined;

            submit?.(result.data);
        } else {
            inputError = formatValidationError(result.error);
        }
    }

    // INPUT BLUR HANDLER
    function handleBlurTime<A extends string>(attr: A) {
        if (attr in inputMotion) {
            (inputMotion as any)[attr] = addColons((inputMotion as any)[attr] ?? "");
        }
    }

    /**
     * Returns true if the inputMotion's kind has the provided fields.
     * This is useful for conditionally showing a field input only if the motion requires that field.
     * 
     * @param m the input motion
     * @param fields the list of fields to check for
     */
    function hasField<F extends string>(m: MotionInput, fields: F[]): m is MotionInputWithFields<F> {
        const motionFields: readonly string[] = MOTION_FIELDS[m.kind];
        return fields.every(f => motionFields.includes(f));
    }

    // Extension handling.
    function isExtending(m: MotionInput): boolean {
        return m.kind === $selectedMotion?.kind && (m as any).isExtension;
    }

    // If extension, disable "topic" and "speakingTime":
    $: if (isExtending(inputMotion)) {
        let inputified = inputifyMotion($selectedMotion!, $delegateAttributes);
        
        if ("topic" in inputified) (inputMotion as any).topic = inputified.topic;
        if ("speakingTime" in inputified) (inputMotion as any).speakingTime = inputified.speakingTime;
    }
</script>

<script lang="ts" context="module">
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

<form on:submit|preventDefault={submitMotion} on:input={resetInputErrors} class="flex flex-col gap-3 p-3">
    <!-- Motion input form -->
    <label class="label">
        <span>Delegate</span>
        <input 
            class="input"
            class:input-error={inputError?.path.includes("delegate")}
            bind:value={inputMotion.delegate}
            required
            use:popup={{...defaultPopupSettings("delegateInputPopup"), event: "focus-click"}}
            {...defaultPlaceholder($presentDelegates.length === 0)}
        >
    </label>
    <label class="label">
        <span>Motion</span>
        <select 
            class="select" 
            class:input-error={inputError?.path.includes("kind")}
            bind:this={afterDel}
            bind:value={inputMotion.kind}
            on:change={() => inputMotion = { delegate: inputMotion.delegate, kind: inputMotion.kind }}
            >
            {#each Object.entries(MOTION_LABELS) as [value, label]}
            <option {value} {label} />
            {/each}
        </select>
    </label>
    {#if hasField(inputMotion, ["totalTime"])}
    <label class="label">
        <span>Total Time</span>
        <input 
            class="input" 
            placeholder="mm:ss" 
            class:input-error={inputError?.path.includes("totalTime")}
            bind:value={inputMotion.totalTime}
            on:blur={() => handleBlurTime("totalTime")}
            required
        >
    </label>
    {/if}
    {#if hasField(inputMotion, ["speakingTime"])}
    <label class="label">
        <span>Speaking Time</span>
        <input 
            class="input" 
            placeholder="mm:ss" 
            class:input-error={inputError?.path.includes("speakingTime")}
            bind:value={inputMotion.speakingTime}
            on:blur={() => handleBlurTime("speakingTime")}
            disabled={isExtending(inputMotion)}
        >
    </label>
    {/if}
    {#if hasField(inputMotion, ["topic"])}
    <label class="label">
    <span>Topic</span>
    <input 
        class="input" 
        class:input-error={inputError?.path.includes("topic")}
        bind:value={inputMotion.topic}
        disabled={isExtending(inputMotion)}
    >
    </label>
    {/if}
    {#if hasField(inputMotion, ["isExtension"]) && $selectedMotion?.kind === inputMotion.kind}
    <LabeledSlideToggle name="extension-toggle" bind:checked={inputMotion.isExtension}>
    <span>Extend previous motion?</span>
    </LabeledSlideToggle>
    {/if}
    {#if hasField(inputMotion, ["totalTime", "speakingTime"])}
    <div class="text-center">
        <strong>Number of speakers</strong>: {numSpeakersStr(inputMotion.totalTime, inputMotion.speakingTime) ?? '-'}
    </div>
    {/if}

    <slot name="buttons">
        <button 
            class="btn variant-filled-primary" 
            type="submit"
        >
            Add Motion
        </button>
    </slot>

    {#if typeof inputError !== "undefined"}
    <div class="text-error-500 text-center">{inputError.message}</div>
    {/if}

    <!-- Delegate autocomplete popup -->
    <DelPopup
        popupID="delegateInputPopup"
        bind:input={inputMotion.delegate}
        delegates={$delegateAttributes}
        presentDelegates={$presentDelegates}
        on:selection={e => {inputMotion.delegate = e.detail.label; resetInputErrors(); afterDel?.focus()}}
    />
</form>