<!--
  @component A component that wraps around the form used 
    to create or edit a motion.
-->
<script lang="ts">
    import { type Snippet } from 'svelte';
    import { fade } from "svelte/transition";
    import type { z } from "zod";

    import InputExtension from './InputExtension.svelte';
    import InputSpeakingTime from './InputSpeakingTime.svelte';
    import InputString from './InputString.svelte';
    import InputTotalTime from './InputTotalTime.svelte';

    import DelCombobox from "$lib/components/controls/DelCombobox.svelte";
    import { getSessionContext } from "$lib/context/index.svelte";
    import { createMotionSchema, inputifyMotion, MOTION_BASE_FIELDS, MOTION_DEFS, type InputKind, type InputProperties } from "$lib/motions/definitions";
    import { formatValidationError } from "$lib/motions/form_validation";
    import type { MotionInput, MotionInputWithFields } from "$lib/motions/types";
    import type { Motion } from "$lib/types";
    import { hasKey } from "$lib/util";
    import { parseTime, sanitizeTime } from "$lib/util/time";
    import MdiPlus from "~icons/mdi/plus";

    const { selectedMotion, delegates, preferences } = getSessionContext();
    const motionSchema = $derived(createMotionSchema($delegates));
    const defaultInputMotion = () => ({ id: crypto.randomUUID(), kind: "mod" } satisfies MotionInput);

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
    let inputError = $state<z.core.$ZodIssue>();
    // The form element.
    let formEl = $state<HTMLFormElement>();
    
    const motionDef = $derived(MOTION_DEFS[inputMotion.kind]);
    
    function getComponent(k: InputKind) {
        if (k === "totalTime") {
            return InputTotalTime;
        } else if (k === "speakingTime") {
            return InputSpeakingTime;
        } else if (k === "topic") {
            return InputString;
        } else if (k === "extension") {
            return InputExtension;
        } else if (k === "none") {
            return undefined;
        } else {
            k satisfies never;
        }
    }

    let activeElement = $state<HTMLElement>();
    // Motions that you can input into dropdown (taking into account provided preferences)
    let allowedMotions = $derived.by(() => {
        // A map indicating whether a given motion type should appear.
        // If mapped to false, it will not appear.
        // If mapped to true (or not mapped at all), it will also appear.
        const filters: Record<string, boolean> = {
            "rr": $preferences.enableMotionRoundRobin
        };

        return Object.entries(MOTION_DEFS)
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
        if ($selectedMotion?.kind !== inputMotion.kind && hasKey(inputMotion, "isExtension")) {
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
     * Returns true if the inputMotion's kind has the provided fields.
     * This is useful for conditionally showing a field input only if the motion requires that field.
     * 
     * @param m the input motion
     * @param fields the list of fields to check for
     */
    function hasField<F extends string>(m: MotionInput, fields: F[]): m is MotionInputWithFields<F> {
        return fields.every(f => (MOTION_BASE_FIELDS as readonly string[]).includes(f) || hasKey(MOTION_DEFS[m.kind].fields, f));
    }

    // Extension handling.
    function isExtending(m: MotionInput): boolean {
        return m.kind === $selectedMotion?.kind && (m as any).isExtension;
    }

    // If extension, disable "topic" and "speakingTime":
    $effect(() => {
        if (isExtending(inputMotion)) {
            let inputified = inputifyMotion($selectedMotion!);
            
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
        if (typeof totalTime === "string") totalTime = parseTime(sanitizeTime(totalTime));
        if (typeof speakingTime === "string") speakingTime = parseTime(sanitizeTime(speakingTime));

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

<svelte:document bind:activeElement />
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
            {#each allowedMotions as [value, {label}] (value)}
                <option {value} {label}></option>
            {/each}
        </select>
    </label>

    {#each Object.entries(motionDef.fields as Record<string, InputProperties>) as [name, prop] (name)}
        {@const type = typeof prop === "string" ? prop : prop.type}
        {@const args = typeof prop === "string" ? {} : prop}
        {@const Component = getComponent(type)}

        {#if Component}
            <Component
                {name}
                error={inputError?.path.includes(name)}
                focused={(activeElement as any)?.name === name}
                bind:value={(inputMotion as any)[name]}
                isExtending={isExtending(inputMotion)}
                motion={$selectedMotion}
                {...args}
            />
        {/if}
    {/each}

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
            <MdiPlus />
            Add Motion
        </button>
    {/if}

    {#if typeof inputError !== "undefined"}
        <div 
            class="text-error-500 text-center"
            role="alert"
            transition:fade={{ duration: 150 }}
        >
            {inputError.message}
        </div>
    {/if}
</form>