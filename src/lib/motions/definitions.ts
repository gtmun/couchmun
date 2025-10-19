/**
 * Some definitions for motion properties.
 * 
 * This consolidates important properties under one file
 * (other files in `$lib/motions` should only define infrastructure for using motions).
 */

import { z } from "zod";

import { type Delegate, findDelegate } from "$lib/db/delegates";
import type { SessionDatabase } from "$lib/db/index.svelte";
import { nonEmptyString, presentDelegateSchema, refineSpeakingTime, timeSchema, topicSchema } from "$lib/motions/form_validation";
import type { MotionInput } from "$lib/motions/types";
import type { Motion, MotionKind, SortOrder } from "$lib/types";
import { stringifyTime } from "$lib/util/time";

/**
 * The label/name given to each motion kind.
 */
export const MOTION_LABELS: Record<MotionKind, string> = {
    mod: "Moderated Caucus",
    unmod: "Unmoderated Caucus",
    rr: "Round Robin",
    other: "Other"
};
/**
 * The fields that are defined on this motion kind's form.
 */
export const MOTION_FIELDS = {
    mod:   ["id", "delegate", "kind", "totalTime", "speakingTime", "topic", "isExtension"],
    unmod: ["id", "delegate", "kind", "totalTime", "isExtension"],
    rr:    ["id", "delegate", "kind", "totalSpeakers", "speakingTime", "topic"],
    other: ["id", "delegate", "kind", "totalTime", "topic"]
} as const;

// Ok, this is some hacky BS that needs to be explained:
// MOTION_FIELDS is a const used to access the field names of Motion 
// (which can't be done normally sometimes cause TypeScript types aren't accessible at runtime).
//
// However, this requires MOTION_FIELDS's fields match EXACTLY to the definition of Motion (provided in types.d.ts).
// In order to do this, the following set of types are used to assert the two types' equalities.
// - type Is<A, B> is a type that asserts A and B are identical types.
// - type TypeFields is a type that computes the fields as defined by the type.
// - type ConstFields is a type that computes the fields as defined by MOTION_FIELDS.
//
// If these do not match, _assert will raise an error, indicating that something needs to be fixed.
type Is<A, B, True = unknown, False = never> = NoInfer<A> extends B ? NoInfer<B> extends A ? True : False : False;
type TypeFields = { readonly [K in MotionKind]: keyof (Motion & { kind: K }) };
type ConstFields = { [K in keyof typeof MOTION_FIELDS]: (typeof MOTION_FIELDS)[K][number] };
const _assert: Is<TypeFields, ConstFields> = {};

/**
 * The established sort order.
 * Values first in the list are prioritized, with the order parameter handling ties.
 * 
 * Any kinds not specified in this list are thrown at the end.
 */
export const DEFAULT_SORT_PRIORITY: SortOrder = [
    { kind: ["ext"], order: [] },
    { kind: ["rr"], order: [{ property: "speakingTime", ascending: false }] },
    { kind: ["unmod"], order: [{ property: "totalTime", ascending: false }] },
    { kind: ["mod"], order: [{ property: "nSpeakers", ascending: false }, { property: "totalTime", ascending: false }] }
];

/**
 * Schema verification for a given form.
 * This takes the form inputs and verifies & creates the motion object associated with the form.
 */
export function createMotionSchema(delegates: Delegate[]) {
    const base = {
        id: nonEmptyString("ID"),
        delegate: presentDelegateSchema(delegates),
    };

    return z.discriminatedUnion("kind", [
        z.object({
            ...base,
            kind: z.literal("mod"),
            totalTime: timeSchema("Total time"),
            speakingTime: timeSchema("Speaking time"),
            topic: topicSchema(),
            isExtension: z.boolean().default(false)
        }).refine(...refineSpeakingTime()),
        z.object({
            ...base,
            kind: z.literal("unmod"),
            totalTime: timeSchema("Total time"),
            isExtension: z.boolean().default(false)
        }),
        z.object({
            ...base,
            kind: z.literal("rr"),
            speakingTime: timeSchema("Speaking time"),
            topic: topicSchema(),
            totalSpeakers: z.string().transform((s) => parseInt(s))
        }),
        z.object({
            ...base,
            kind: z.literal("other"),
            totalTime: timeSchema("Total time"),
            topic: topicSchema()
        })
    ]) satisfies z.ZodType<Motion, any, any>;
}

function partialInputifyMotion(m: Motion): MotionInput {
    if (m.kind === "mod") {
        return {
            id: m.id,
            delegate: "",
            kind: m.kind,
            totalTime: stringifyTime(m.totalTime),
            speakingTime: stringifyTime(m.speakingTime),
            topic: m.topic,
            isExtension: m.isExtension
        }
    } else if (m.kind === "unmod") {
        return {
            id: m.id,
            delegate: "",
            kind: m.kind,
            totalTime: stringifyTime(m.totalTime),
            isExtension: m.isExtension
        }
    } else if (m.kind === "rr") {
        return {
            id: m.id,
            delegate: "",
            kind: m.kind,
            speakingTime: stringifyTime(m.speakingTime),
            topic: m.topic,
        }
    } else if (m.kind === "other") {
        return {
            id: m.id,
            delegate: "",
            kind: m.kind,
            totalTime: stringifyTime(m.totalTime),
            topic: m.topic,
        }
    } else {
        return m satisfies never;
    }
}

/**
 * Defines how to convert a motion back into a motion input
 * (e.g., the text to submit in a motion form to get back this motion).
 * 
 * When no delegate parameter is provided, the `delegates` field of this input is empty.
 * 
 * @param m the motion
 * @returns the motion as input
 */
export function inputifyMotion(m: Motion): MotionInput;
/**
 * Defines how to convert a motion back into a motion input
 * (e.g., the text to submit in a motion form to get back this motion).
 * 
 * When a delegate array is provided, the `delegates` field of this input is set to the name
 * of an element of the array with the same ID (if it exists).
 * 
 * @param m the motion
 * @param delegates an array of delegates
 * @returns the motion as input
 */
export function inputifyMotion(m: Motion, delegates: Delegate[]): MotionInput;
/**
 * Defines how to convert a motion back into a motion input
 * (e.g., the text to submit in a motion form to get back this motion).
 * 
 * When a database table is provided, the `delegates` field of this input is set to the name
 * of an entry in the database with the same ID.
 * 
 * @param m the motion
 * @param delegates a database table holding delegate information
 * @returns the motion as input
 */
export function inputifyMotion(m: Motion, delegates: SessionDatabase["delegates"]): Promise<MotionInput>;
export function inputifyMotion(m: Motion, delegates?: any): any {
    const im = partialInputifyMotion(m);

    // If session database:
    if (typeof delegates === "object") {
        return (delegates as SessionDatabase["delegates"]).get(m.delegate).then(d => {
            if (d) im.delegate = d.name;
            return im;
        });
    }

    // If array:
    if (delegates instanceof Array) {
        im.delegate = findDelegate(delegates, m.delegate)?.name ?? "";
    }
    // If undefined:
    return im;
}