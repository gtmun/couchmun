import type { ObjectSchema } from "yup";
import type { Motion, MotionKind, SortEntry } from "../types";
import { speakingTimeSchema, timeSchema, topicSchema } from "./form_validation";
import type { ComponentType, SvelteComponent } from "svelte";
import ModCaucus from "../motion/ModCaucus.svelte";
import UnmodCaucus from "../motion/UnmodCaucus.svelte";
import RoundRobin from "../motion/RoundRobin.svelte";

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
    mod:   ["delegate", "kind", "totalTime", "speakingTime", "topic"],
    unmod: ["delegate", "kind", "totalTime"],
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
 * The component type to use for /dashboard/current_motions.
 */
export const MOTION_COMPONENTS = {
    mod: ModCaucus,
    unmod: UnmodCaucus,
    rr: RoundRobin,
    other: undefined /* TODO */
} satisfies Record<MotionKind, ComponentType<SvelteComponent> | undefined>;

// More hacky BS.
// Asserts that each component defined in MOTION_COMPONENTS (ignoring undefined values):
// - has a motion field, and
// - accepts motions of the specified kind.
// For example, the UnmodCaucus component should accept motions of kind "unmod".
//
// If any of the components cannot support their respective motion, the _assertAccepts raises an error
// (listing the problematic keys).
// This typically can be fixed by adjusting the type in the component's props.
type AssertComponentAccepts<K, V> =
    V extends ComponentType<SvelteComponent<infer P>> ?
        P extends { motion: infer M } ?
            Motion & { kind: K } extends M ? true : false
        : false
    : true;
type AssertAllComponentsAccept<O extends {}> = Pick<
    // Creates a mapping of key => acceptable
    { [K in keyof O]: AssertComponentAccepts<K, O[K]> },
    // Gets all keys where this is false. This means when the result is non-empty, there are problematic keys.
    { [K in keyof O]-?: AssertComponentAccepts<K, O[K]> extends false ? K : never }[keyof O]
>;

type Z2<O> = O extends [infer R, false] ? R : never;
const _assertAccepts: AssertAllComponentsAccept<typeof MOTION_COMPONENTS> = {};

/**
 * The established sort order.
 * Values first in the list are prioritized, with the order parameter handling ties.
 * 
 * Any kinds not specified in this list are thrown at the end.
 */
export const SORT_PRIORITY: SortEntry[] = [
    { kind: "unmod", order: ["totalTime asc"] },
    { kind: ["mod", "rr"], order: ["totalTime asc", "nSpeakers asc"] }
];

/**
 * Schema verification for a given form.
 * This takes the form inputs and verifies & creates the motion object associated with the form.
 * 
 * This is used by the createObjectSchema function of the form_validation.ts file, and should not
 * be used explicitly.
 */
export function defineFormFields(schema: ObjectSchema<{ [K in keyof Motion]: Motion[K] }>, kind: MotionKind) {
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
    } else if (kind === "rr") {
        return schema.shape({
            speakingTime: timeSchema("speaking time"),
            topic: topicSchema()
        })
    } else if (kind === "other") {
        return schema.shape({
            totalTime: timeSchema(),
            topic: topicSchema()
        })
    } else {
        kind satisfies never;
        throw new Error("Invalid motion kind " + kind);
    }
}