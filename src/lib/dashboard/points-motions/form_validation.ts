import type { DelegateAttrs, MotionKind } from "$lib/dashboard/types";
import { parseTime } from "$lib/time";
import { object, string, number } from 'yup';

const MOTION_KINDS = ["mod", "unmod", "other"] as const;

// Type magic.
type Is<T, U> = Exclude<T, U> extends never ? Exclude<U, T> extends never ? true : false : false;
const _assertAllMotionsAreDefined: Is<typeof MOTION_KINDS[number], MotionKind> = true;
// 

// More type magic
function inArray<T>(el: any, arr: readonly T[]): el is T {
    return arr.includes(el);
}

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
        .oneOf(MOTION_KINDS);
}

function timeSchema(label: string = "total time") {
    return number()
        .label(label)
        .integer()
        .positive()
        .transform((val, origVal, ctx) => parseTime(origVal) ?? null)
        .required()
        .nonNullable("${path} is not a valid time string (mm:ss)");
}
function speakingTimeSchema(totalTimeAttr = "totalTime") {
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
function topicSchema() {
    return string()
        .label("topic")
        .trim()
        .required();
}

export function createMotionSchema(delegates: Record<string, DelegateAttrs>, presentDelegates: string[]) {
    return object({
        delegate: presentDelegateSchema(delegates, presentDelegates),
        kind: kindSchema(),
    }).when(([{ kind }], schema) => {
        if (!inArray(kind, MOTION_KINDS)) return schema;
        if (kind === "mod") {
            return schema.shape({
                totalTime: timeSchema(),
                speakingTime: speakingTimeSchema(),
                topic: topicSchema()
            });
        } else if (kind === "unmod") {
            return schema.shape({
                totalTime: timeSchema()
            })
        } else if (kind === "other") {
            return schema.shape({
                totalTime: speakingTimeSchema(),
                topic: topicSchema()
            })
        } else {
            kind satisfies never;
            throw new Error("Invalid motion kind " + kind);
        }
    });
}
