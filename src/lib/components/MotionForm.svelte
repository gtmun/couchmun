<!--
  @component A component that wraps around the form used 
    to create or edit a motion.
-->
<script lang="ts">
    import LabeledSwitch from "$lib/components/LabeledSwitch.svelte";
    import { getSessionContext } from "$lib/context/index.svelte";
    import { createMotionSchema, inputifyMotion, MOTION_FIELDS, MOTION_LABELS } from "$lib/motions/definitions";
    import { formatValidationError } from "$lib/motions/form_validation";
    import type { MotionInput, MotionInputWithFields } from "$lib/motions/types";
    import { addColons, parseTime } from "$lib/util/time";
    import type { Motion } from "$lib/types";
    
    import type { z } from "zod";
    import { type Snippet } from 'svelte';
    import DelCombobox from "./DelCombobox.svelte";

    const { selectedMotion, delegates, preferences } = getSessionContext();
    const motionSchema = $derived(createMotionSchema($delegates));
    const defaultInputMotion = () => ({ id: crypto.randomUUID(), kind: "mod" } satisfies MotionInput);
    const resetInputErrors = () => { inputError = undefined };

    interface Props {
        /**
         * The input data.
         */
        inputMotion?: MotionInput;
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
        inputMotion = $bindable(defaultInputMotion()),
        submit,
        buttons
    }: Props = $props();
    
    // Any input validation errors.
    let inputError = $state<z.ZodIssue>();
    // The form element.
    let formEl = $state<HTMLFormElement>();
    // Motions that you can input into dropdown (taking into account provided preferences)
    let allowedMotions = $derived.by(() => {
        // A map indicating whether a given motion type should appear.
        // If mapped to false, it will not appear.
        // If mapped to true (or not mapped at all), it will also appear.
        const filters: Record<string, boolean> = {
            "rr": $preferences.enableMotionRoundRobin
        };

        return Object.entries(MOTION_LABELS)
            .filter(([kind]) => filters[kind] ?? true);
    });
    
    // Motion validation and submission.
    function submitMotion(e: SubmitEvent) {
        e.preventDefault();

        // Round-Robin: Apply total speakers
        if (inputMotion.kind === "rr") {
            inputMotion.totalSpeakers = $delegates.filter(d => d.isPresent()).length.toString();
        }

        // Filter out any keys that aren't the correct kind:
        for (let key of Object.keys(inputMotion)) {
            if (!hasField(inputMotion, [key])) {
                delete inputMotion[key];
            }
        }
        if ($selectedMotion?.kind !== inputMotion.kind && "isExtension" in inputMotion) {
            delete inputMotion["isExtension"];
        }

        // Validate input
        const result = motionSchema.safeParse(inputMotion);
        if (result.success) {
            inputMotion = defaultInputMotion();
            inputError = undefined;

            submit?.(result.data);
        } else {
            inputError = formatValidationError(result.error);
        }
    }

    /**
     * When user unfocuses on a time input, update the input to include colons.
     */
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
    $effect(() => {
        if (isExtending(inputMotion)) {
            let inputified = inputifyMotion($selectedMotion!);
            
            if ("topic" in inputified) (inputMotion as any).topic = inputified.topic;
            if ("speakingTime" in inputified) (inputMotion as any).speakingTime = inputified.speakingTime;
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

<form onsubmit={submitMotion} oninput={resetInputErrors} class="flex flex-col gap-3 p-3" bind:this={formEl}>
    <!-- Delegate input -->
    <label class="label">
        <span>Delegate</span>
        <!-- TODO: focus on next el after this one is done -->
        <DelCombobox
            bind:input={inputMotion.delegate}
            delegates={$delegates}
            error={inputError?.path.includes("delegate")}
        />
    </label>

    <!-- Motion dropdown -->
    <label class="label">
        <span>Motion</span>
        <select 
            class="select" 
            class:input-error={inputError?.path.includes("kind")}
            bind:value={inputMotion.kind}
            >
            {#each allowedMotions as [value, label]}
                <option {value} {label}></option>
            {/each}
        </select>
    </label>

    <!-- Total time input -->
    {#if hasField(inputMotion, ["totalTime"])}
    <label class="label">
        <span>Total Time</span>
        <input 
            class="input" 
            placeholder="mm:ss" 
            class:input-error={inputError?.path.includes("totalTime")}
            bind:value={inputMotion.totalTime}
            onblur={() => handleBlurTime("totalTime")}
            required
        >
    </label>
    {/if}

    <!-- Speaking time input -->
    {#if hasField(inputMotion, ["speakingTime"])}
    <label class="label">
        <span>Speaking Time</span>
        <input 
            class="input" 
            placeholder="mm:ss" 
            class:input-error={inputError?.path.includes("speakingTime")}
            bind:value={inputMotion.speakingTime}
            onblur={() => handleBlurTime("speakingTime")}
            disabled={isExtending(inputMotion)}
        >
    </label>
    {/if}

    <!-- Topic input -->
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

    <!-- Extension toggle -->
    {#if $preferences.enableMotionExt && hasField(inputMotion, ["isExtension"]) && $selectedMotion?.kind === inputMotion.kind}
        <LabeledSwitch name="extension-toggle" bind:checked={inputMotion.isExtension}>
            <span>Extend previous motion?</span>
        </LabeledSwitch>
    {/if}

    <!-- Number of speakers display -->
    {#if hasField(inputMotion, ["totalTime", "speakingTime"])}
    <div class="text-center">
        <strong>Number of speakers</strong>: {numSpeakersStr(inputMotion.totalTime, inputMotion.speakingTime) ?? '-'}
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
            Add Motion
        </button>
    {/if}

    {#if typeof inputError !== "undefined"}
        <div class="text-error-500 text-center">{inputError.message}</div>
    {/if}
</form>