/**
 * Some definitions for motion properties.
 * 
 * This consolidates important properties under one file
 * (other files in `$lib/motions` should only define infrastructure for using motions).
 */

import { z } from "zod";

import { type Delegate } from "$lib/db/delegates";
import { presentDelegateSchema, refineSpeakingTime, stringSchema, stringToIntSchema, timeSchema, type SchemaOutput } from "$lib/motions/form_validation";
import type { Is } from "$lib/motions/types";
import type { Motion, MotionKind, SortOrder } from "$lib/types";

export type InputKind =
    | "totalTime"
    | "speakingTime"
    | "topic"
    | "extension"
    | "none";
export type InputProperties = InputKind | {
    type: InputKind,
    [prop: string]: unknown
};

export const MOTION_BASE_FIELDS = ["id", "kind", "delegate"] as const;
export const MOTION_DEFS = {
    mod: {
        label: "Moderated Caucus",
        fields: {
            totalTime: "totalTime",
            speakingTime: "speakingTime",
            topic: "topic",
            isExtension: "extension",
        }
    },
    unmod: {
        label: "Unmoderated Caucus",
        fields: {
            totalTime: "totalTime",
            isExtension: "extension",
        }
    },
    rr: {
        label: "Round Robin",
        fields: {
            speakingTime: "speakingTime",
            topic: "topic",
            // FIXME: Remove as form field
            totalSpeakers: "none"
        }
    },
    other: {
        label: "Other",
        fields: {
            totalTime: {
                type: "totalTime",
                required: false
            },
            topic: {
                type: "topic",
                required: false
            },
        }
    },
} satisfies Record<Motion["kind"], {
    label: string,
    fields: Record<string, InputProperties>
}>;

export type InputComponentProps<V> = {
    name: string,
    error?: boolean,
    focused?: boolean,
    value?: V,
    isExtending?: boolean,
    motion: Motion | null
};

// Ok, this is some hacky BS that needs to be explained:
// MOTION_DEFS includes a list of form fields for Motion.
//
// This assert checks if the form fields defined by MOTION_DEFS matches exactly the fields of the Motion type
// (defined in types.d.ts).
//
// In order to do this, the following set of types are used to assert the two types' equalities.
// - type Is<A, B> is a type that asserts A and B are identical types.
// - type TypeFields is a type that computes the fields as defined by the type.
// - type ConstFields is a type that computes the fields as defined by MOTION_DEFS.
//
// If these do not match, _assert will raise an error, indicating that something needs to be fixed.
type TypeFields = { readonly [K in MotionKind]: keyof (Motion & { kind: K }) };
type ConstFields = { readonly [K in keyof typeof MOTION_DEFS]: (typeof MOTION_BASE_FIELDS)[number] | keyof (typeof MOTION_DEFS)[K]["fields"] };
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
        id: stringSchema("ID"),
        delegate: presentDelegateSchema(delegates),
    };

    return z.discriminatedUnion("kind", [
        z.object({
            ...base,
            kind: z.literal("mod"),
            totalTime: timeSchema("Total time"),
            speakingTime: timeSchema("Speaking time"),
            topic: stringSchema("Topic"),
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
            topic: stringSchema("Topic"),
            totalSpeakers: stringToIntSchema(),
        }),
        z.object({
            ...base,
            kind: z.literal("other"),
            totalTime: timeSchema("Total time"),
            topic: stringSchema("Topic")
        })
    ]);
}
const _assert_o: Is<SchemaOutput<typeof createMotionSchema>, Motion> = {};

/** Type of motion schema verification. */
export type MotionSchema = ReturnType<typeof createMotionSchema>;