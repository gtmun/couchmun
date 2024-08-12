import type { DelegateAttrs, MotionKind } from "$lib/dashboard/types";
import { defineFormFields, MOTION_LABELS } from "$lib/dashboard/points-motions/definitions";
import { parseTime } from "$lib/time";
import { object, string, number } from 'yup';

/**
 * Creates a schema that requires the input is the name of a present delegate.
 * This also transforms the input to the key of the delegate.
 * 
 * @param delegates record of delegates
 * @param presentDelegates the list of present delegates
 * @returns the schema
 */
function presentDelegateSchema(delegates: Record<string, DelegateAttrs>, presentDelegates: string[]) {
    return string()
        .label("delegate name")
        .trim()
        .transform(name => Object.keys(delegates).find(k => delegates[k].name === name) ?? null) // convert to del key
        .required()
        .nonNullable("'${originalValue}' is not a delegate")
        .oneOf(presentDelegates, "'${originalValue}' is not a present delegate");
}

function kindSchema() {
    return string()
        .label("motion kind")
        .trim()
        .required()
        .oneOf(Object.keys(MOTION_LABELS) as MotionKind[]);
}

export function timeSchema(label: string = "total time") {
    return number()
        .label(label)
        .integer()
        .positive()
        .transform((val, origVal, ctx) => parseTime(origVal) ?? null)
        .required()
        .nonNullable("${path} is not a valid time string (mm:ss)");
}
export function speakingTimeSchema(totalTimeAttr = "totalTime") {
    return timeSchema("speaking time")
        .test(
            "total-time-divisible-by-speaking-time",
            "Total time cannot be evenly divided among speakers",
            (speakingTime, ctx) => {
                let totalTime: number = ctx.parent[totalTimeAttr];
                return totalTime % speakingTime == 0;
            }
        )
}
export function topicSchema() {
    return string()
        .label("topic")
        .trim()
        .required();
}

export function createMotionSchema(delegates: Record<string, DelegateAttrs>, presentDelegates: string[]) {
    return object({
        delegate: presentDelegateSchema(delegates, presentDelegates),
        kind: kindSchema(),
    }).when(([{ kind }], schema) => defineFormFields(schema, kind));
}
