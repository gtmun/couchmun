/**
 * Some definitions for motion properties.
 * 
 * This consolidates important properties under one file
 * (other files in `$lib/motions` should only define infrastructure for using motions).
 */

import { z } from "zod";

import type { IconComponent } from "$lib/components/IconLabel.svelte";
import { numSpeakersStr } from "$lib/components/motions/form/MotionForm.svelte";
import { type Delegate } from "$lib/db/delegates";
import { optional, presentDelegateSchema, refineSpeakingTime, stringSchema, stringToIntSchema, timeSchema, type Refine, type SchemaOutput } from "$lib/motions/form_validation";
import type { InputKind } from "$lib/motions/input";
import { SORT_KIND_EXTRAS_NAMES, SORT_PROPERTY_NAMES } from "$lib/motions/sort";
import type { Is } from "$lib/motions/types";
import type { Motion, MotionKind, SortKind, SortOrder } from "$lib/types";
import { hasKey } from "$lib/util";
import { stringifyTime } from "$lib/util/time";
import MdiAccountClock from "~icons/mdi/account-clock";
import MdiAccountMultiple from "~icons/mdi/account-multiple";
import MdiClock from "~icons/mdi/clock";

export const MOTION_BASE_FIELDS = ["id", "kind", "delegate"] as const;
const INPUT_KINDS = {
    time: (label: string) => ({
        input: "time",
        schema: timeSchema(label),
        label
    }),
    totalTime: {
        input: "totalTime",
        schema: timeSchema("Total time"),
    },
    speakingTime: {
        input: "speakingTime",
        schema: timeSchema("Speaking time"),
    },
    text: (label: string) => ({
        input: "text",
        schema: stringSchema(label),
        label
    }),
    extension: {
        input: "extension",
        schema: z.boolean().default(false)
    },
    none: {
        input: "none",
        schema: stringToIntSchema()
    },
} satisfies Record<string, FieldProperties | ((...args: any[]) => FieldProperties)>;
const optionalInput = <O extends { schema: z.ZodType<unknown, string> }>({ schema, ...rest }: O) => ({
    ...rest, schema: optional<O["schema"]>(schema)
});

export const MOTION_GROUP_LABELS = {
    opening: "Opening",
    voting: "Voting"
};

interface MotionDisplayEntry {
    /** Text/name of the field. */
    header: string,
    /** Icon to use if window is too narrow. */
    icon?: IconComponent,
    /** Value of field. */
    value: string | number | undefined,
    /** Whether to right align the value. */
    right?: boolean,
}
export type MotionDisplayFunction<M> = (motion: M, delegates: Delegate[]) => readonly MotionDisplayEntry[];
const _MDE_TEMPLATES = {
    topic: { header: SORT_PROPERTY_NAMES.topic },
    nSpeakers: { header: "Speakers", icon: MdiAccountMultiple, right: true },
    speakingTime: { header: SORT_PROPERTY_NAMES.speakingTime, icon: MdiAccountClock, right: true },
    totalTime: { header: SORT_PROPERTY_NAMES.totalTime, icon: MdiClock, right: true },
} satisfies Record<string, Omit<MotionDisplayEntry, "value">>;

/// Gets the non-base motion fields associated with a given motion kind.
type ExtraMotionFields<K extends MotionKind> = Exclude<keyof (Motion & { kind: K }), typeof MOTION_BASE_FIELDS[number]>;
export type FieldProperties = {
    /** The type of input. This is typically directly associated with some component.
     * 
     * See `getComponent` in `"$lib/motions/sort"`.
    */
    input: InputKind,
    /** The schema used to validate the input. */
    schema: z.ZodType,
    /** Any arguments used for the input type. */
    [s: string]: unknown
};
export const MOTION_DEFS = {
    mod: {
        label: "Moderated Caucus",
        fields: {
            totalTime: INPUT_KINDS.totalTime,
            speakingTime: INPUT_KINDS.speakingTime,
            topic: INPUT_KINDS.text("Topic"),
            isExtension: INPUT_KINDS.extension,
        },
        refine: refineSpeakingTime(),
        display: m => [
            { ..._MDE_TEMPLATES.topic, value: m.topic },
            { ..._MDE_TEMPLATES.nSpeakers, value: numSpeakersStr(m.totalTime, m.speakingTime) },
            { ..._MDE_TEMPLATES.speakingTime, value: stringifyTime(m.speakingTime) },
            { ..._MDE_TEMPLATES.totalTime, value: stringifyTime(m.totalTime) },
        ]
    },
    unmod: {
        label: "Unmoderated Caucus",
        fields: {
            totalTime: INPUT_KINDS.totalTime,
            isExtension: INPUT_KINDS.extension,
        },
        display: m => [
            { ..._MDE_TEMPLATES.topic, value: undefined },
            { ..._MDE_TEMPLATES.totalTime, value: stringifyTime(m.totalTime) },
        ]
    },
    rr: {
        label: "Round Robin",
        fields: {
            speakingTime: INPUT_KINDS.speakingTime,
            topic: INPUT_KINDS.text("Topic"),
            // FIXME: Remove as form field
            totalSpeakers: INPUT_KINDS.none
        },
        display: (m, delegates) => {
            const nSpeakers = delegates.filter(d => d.isPresent()).length;
            return [
                { ..._MDE_TEMPLATES.topic, value: m.topic },
                { ..._MDE_TEMPLATES.nSpeakers, value: nSpeakers },
                { ..._MDE_TEMPLATES.speakingTime, value: stringifyTime(m.speakingTime) },
                { ..._MDE_TEMPLATES.totalTime, value: stringifyTime(nSpeakers * m.speakingTime) },
            ];
        }
    },
    other: {
        label: "Other",
        fields: {
            totalTime: optionalInput(INPUT_KINDS.totalTime),
            topic: optionalInput(INPUT_KINDS.text("Topic")),
        },
        display: m => [
            { ..._MDE_TEMPLATES.topic, value: m.topic },
            { ..._MDE_TEMPLATES.totalTime, value: typeof m.totalTime === "number" ? stringifyTime(m.totalTime) : undefined, right: true },
        ]
    },
} satisfies { [K in MotionKind]: {
    label: string,
    group?: keyof typeof MOTION_GROUP_LABELS,
    fields: Record<ExtraMotionFields<K>, FieldProperties>,
    refine?: Refine,
    display: MotionDisplayFunction<Motion & { kind: K }>
}};

/** List of every motion (as defined in `MOTION_DEFS` above). */
const MOTION_KINDS = ["mod", "unmod", "rr", "other"] as const;
/**
 * This const asserts that `MOTION_DEFS` and `MOTION_KINDS` match.
 * If it errors, you should add the missing key to `MOTION_KINDS`.
 */
const _assertAllMotionDefsInMKArray: Is<keyof typeof MOTION_DEFS, typeof MOTION_KINDS[number]> = true;

export type InputComponentProps<V> = {
    name: string,
    error?: boolean,
    value?: V,
    isExtending?: boolean,
    motion: Motion | null
};

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

export function getSortLabel(k: SortKind) {
    return (MOTION_DEFS as Record<string, { label: string } | undefined>)[k]?.label 
        ?? (SORT_KIND_EXTRAS_NAMES as Record<string, string>)[k];
}

// ~~~ TYPE SPAGHETTI ~~~

/**
 * Takes any arbitrary MOTION_DEFS[_].fields object (Record<string, { kind: K, schema: S }>)
 * and converts it into an object that maps each field name to its schema (Record<string, S>).
 * 
 * The benefit of this function is that this preserves the type structure
 * of the specified fields parameter.
 * 
 * @param fields A (preferably const) structure
 * @returns the mapped version.
 */
function _extraPropSchema<F extends Record<string, { schema: unknown }>>(fields: F) {
    return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.schema])) as { [K in keyof F]: F[K]["schema"] };
}
/**
 * Generates the z.object(...) validator for a motion kind.
 * This can be used to validate motions of the specified kind.
 * 
 * The benefit of this function is that it preserves the type structure
 * defined in MOTION_DEFS (needed to validate `createMotionSchema` outputs `Motion`s).
 * 
 * @param base Shared base between different motions (see `createMotionSchema` impl)
 * @param kind The kind of motion (structure of which should be defined in `MOTION_DEFS`).
 * @returns the `z.object(...)`
 */
function _zObjectFromMKind<K extends MotionKind, B extends object>(base: B, kind: K) {
    let o = z.object({
        ...base,
        kind: z.literal(kind),
        ..._extraPropSchema<typeof MOTION_DEFS[K]["fields"]>(MOTION_DEFS[kind].fields)
    });
    
    // Apply any refines:
    if (hasKey(MOTION_DEFS[kind], "refine")) {
        o = o.refine(...MOTION_DEFS[kind].refine);
    }

    return o;
}
/**
 * Generates a tuple of z.object(...) validators for a given list of motion kinds.
 * See `_zObjectFromMKind` for type benefits.
 * 
 * In `createMotionSchema`, this is plugged with the default base and 
 * 
 * @param base Shared base between different motions (see `createMotionSchema` impl)
 * @param kind A tuple of the motion kinds to apply, which should just be `MOTION_KINDS` (all of the motion kinds)
 * @returns a tuple of `z.object(...)`s
 */
function _zObjectsFromMKinds<A extends readonly MotionKind[], B extends object>(base: B, kind: A) {
    return kind.map(k => _zObjectFromMKind(base, k)) as {[K in keyof A]: ReturnType<typeof _zObjectFromMKind<A[K], B>> };
}

// ~~ END TYPE SPAGHETTI ~~

/**
 * Schema verification for a given motion.
 * This takes the form inputs and verifies & creates the motion object associated with the form.
 */
export function createMotionSchema(delegates: Delegate[]) {
    const base = {
        id: stringSchema("ID"),
        delegate: presentDelegateSchema(delegates)
    };
    // Given tuple of all motion schemas,
    // create a unified schema which accepts any motion kind.
    return z.discriminatedUnion("kind", _zObjectsFromMKinds(base, MOTION_KINDS));
}
const _assertSchemaValidatesMotions: Is<SchemaOutput<typeof createMotionSchema>, Motion> = true;

/** Type of motion schema verification. */
export type MotionSchema = ReturnType<typeof createMotionSchema>;