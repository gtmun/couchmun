import InputExtension from "$lib/components/motions/form/InputExtension.svelte";
import InputSpeakingTime from "$lib/components/motions/form/InputSpeakingTime.svelte";
import InputString from "$lib/components/motions/form/InputString.svelte";
import InputTime from "$lib/components/motions/form/InputTime.svelte";
import InputTotalTime from "$lib/components/motions/form/InputTotalTime.svelte";
import type { MotionKind } from "$lib/types";

export type InputKind = "time" | "totalTime" | "speakingTime" | "text" | "extension" | "none";
export function getComponent(k: InputKind, state: { inputKind?: MotionKind, prevMotionKind?: MotionKind, extEnabled?: boolean }) {
    if (k === "time") return InputTime;
    if (k === "totalTime") return InputTotalTime;
    if (k === "speakingTime") return InputSpeakingTime;
    if (k === "text") return InputString;
    if (k === "extension") {
        // Only allow if motion is the same
        if (state.extEnabled && state.inputKind === state.prevMotionKind) {
            return InputExtension;
        } else {
            return undefined;
        }
    }
    if (k === "none") return undefined;
    return k satisfies never;
}
