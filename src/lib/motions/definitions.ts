import type { DelegateAttrs, Motion, MotionKind, SortEntry } from "$lib/types";
import { presentDelegateSchema, refineSpeakingTime, timeSchema, topicSchema } from "$lib/motions/form_validation";
import { z } from "zod";

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
    mod:   ["delegate", "kind", "totalTime", "speakingTime", "topic", "isExtension"],
    unmod: ["delegate", "kind", "totalTime", "isExtension"],
    rr:    ["delegate", "kind", "speakingTime", "topic"],
    other: ["delegate", "kind", "totalTime", "topic"]
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
export const DEFAULT_SORT_PRIORITY: SortEntry[] = [
    { kind: ["ext"], order: [] },
    { kind: ["unmod"], order: [{ property: "totalTime", ascending: false }] },
    { kind: ["mod", "rr"], order: [{ property: "totalTime", ascending: false }, { property: "nSpeakers", ascending: false }] }
];

/**
 * Schema verification for a given form.
 * This takes the form inputs and verifies & creates the motion object associated with the form.
 */
export function createMotionSchema(delegates: Record<string, DelegateAttrs>, presentDelegates: string[]) {
    const base = <K extends MotionKind>(k: K) => z.object({
        delegate: presentDelegateSchema(delegates, presentDelegates),
        kind: z.literal(k)
    });

    return z.union([
        base("mod").extend({
            totalTime: timeSchema("Total time"),
            speakingTime: timeSchema("Speaking time"),
            topic: topicSchema(),
            isExtension: z.boolean().default(false)
        }).refine(...refineSpeakingTime()),
        base("unmod").extend({
            totalTime: timeSchema("Total time"),
            isExtension: z.boolean().default(false)
        }),
        base("rr").extend({
            speakingTime: timeSchema("Speaking time"),
            topic: topicSchema()
        }),
        base("other").extend({
            totalTime: timeSchema("Total time"),
            topic: topicSchema()
        })
    ]) satisfies z.ZodType<Motion, any, any>;
}