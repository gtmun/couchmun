/**
 * Some definitions for motion properties.
 * 
 * This consolidates important properties under one file
 * (other files in `$lib/motions` should only define infrastructure for using motions).
 */

import { z } from "zod";

import type { RouteId } from "$app/types";
import type { IconComponent } from "$lib/components/IconLabel.svelte";
import { numSpeakersStr } from "$lib/components/motions/form/MotionForm.svelte";
import { type Delegate } from "$lib/db/delegates";
import { optional, presentDelegateSchema, refineSpeakingTime, stringSchema, timeSchema, type Refine, type SchemaOutput } from "$lib/motions/form_validation";
import type { InputKind } from "$lib/motions/input";
import { baseCompareMotions, SORT_KIND_EXTRAS_NAMES, SORT_PROPERTY_NAMES } from "$lib/motions/sort";
import type { Is } from "$lib/motions/types";
import type { Motion, MotionKind, SortKind, SortOrder } from "$lib/types";
import { hasKey, type Comparator } from "$lib/util";
import { stringifyTime } from "$lib/util/time";
import MdiAccountClock from "~icons/mdi/account-clock";
import MdiAccountMultiple from "~icons/mdi/account-multiple";
import MdiBookClock from "~icons/mdi/book-clock";
import MdiClipboardClock from "~icons/mdi/clipboard-clock";
import MdiClock from "~icons/mdi/clock";
import MdiCookieClockOutline from "~icons/mdi/cookie-clock-outline";

export const MOTION_BASE_FIELDS = ["id", "kind", "delegate"] as const;
const INPUT_KINDS = {
    time: (label: string) => ({
        input: "time",
        schema: timeSchema(label),
        label,
        isSortable: true
    }),
    totalTime: {
        input: "totalTime",
        schema: timeSchema("Total time"),
        isSortable: true
    },
    speakingTime: {
        input: "speakingTime",
        schema: timeSchema("Speaking time"),
        isSortable: true
    },
    text: (label: string, autocomplete?: string[]) => ({
        input: "text",
        schema: stringSchema(label),
        label,
        autocomplete
    }),
    extension: {
        input: "extension",
        schema: z.boolean().default(false)
    }
} satisfies Record<string, FieldProperties | ((...args: any[]) => FieldProperties)>;
const optionalInput = <O extends { schema: z.ZodType<unknown, string> }>({ schema, ...rest }: O) => ({
    ...rest, schema: optional<O["schema"]>(schema)
});

export const MOTION_GROUP_LABELS = {
    opening: "Opening",
    voting: "Voting",
    closing: "Closing"
};

/** Creates a "field" from a motion. Used for computed fields and display. */
type MotionFn<M extends Motion, R> = (motion: M, delegates: Delegate[]) => R;

export interface DisplayFieldHeader {
    /** Text/name of the field. */
    header: string,
    /** Icon to use if window is too narrow. */
    icon?: IconComponent,
    right?: boolean
}
export const DISPLAY_FIELD_HEADERS = {
    topic: { header: SORT_PROPERTY_NAMES.topic },
    totalTime: { header: SORT_PROPERTY_NAMES.totalTime, icon: MdiClock, right: true },
    speakingTime: { header: SORT_PROPERTY_NAMES.speakingTime, icon: MdiAccountClock, right: true },
    nSpeakers: { header: "Speakers", icon: MdiAccountMultiple, right: true },
    docOrder: { header: "Order" },
    docRp: { header: "Reading Period", icon: MdiCookieClockOutline, right: true },
    docAp: { header: "Author's Panel", icon: MdiBookClock, right: true },
    docQna: { header: "Q&A", icon: MdiClipboardClock, right: true },
    vpMethod: { header: "Method" }
} satisfies Record<string, DisplayFieldHeader>;
export type DisplayFieldKey = keyof typeof DISPLAY_FIELD_HEADERS;
type DisplayFieldRecord = Partial<Record<DisplayFieldKey, string | number | undefined>>;

/** Properties used to define a motion. */
export type MotionDef<K extends MotionKind = MotionKind, Fields extends PropertyKey = PropertyKey> = {
    /** Name (label) of motion */
    label: string,
    /**
     * The motion's group (or none if not part of a group).
     * 
     * This is used to partition groups in the motion dropdown.
     **/
    group?: keyof typeof MOTION_GROUP_LABELS,
    /** Field property definitions for the motion (these are all fields defined in the `Motion` type). */
    fields: Record<Fields, FieldProperties>,
    /** Computed fields. These are fields which are computed and can be used for sorting. */
    computedFields?: Record<string, MotionFn<Motion & {kind: K}, unknown>>,
    /** Extra constraints for a given motion (in the form of a Zod schema refine) */
    refine?: Refine,
    /**
     * Defines which link this motion goes to once accepted.
     * 
     * This defaults to `/dashboard/current-motion/` if not present.
     **/
    goto: RouteId | MotionFn<Motion & {kind: K}, RouteId>,
    /** The fields to display in the motion list. */
    display: MotionFn<Motion & { kind: K }, DisplayFieldRecord>
};

type ExtraMotionFields<K extends MotionKind> = Exclude<keyof (Motion & { kind: K }), typeof MOTION_BASE_FIELDS[number]>;
type MotionDefOf<K extends MotionKind> = MotionDef<K, ExtraMotionFields<K>>;

function getSortableField(m: Motion, delegates: Delegate[], k: string): unknown {
    return (m as Record<string, unknown>)[k]
        ?? (MOTION_DEFS[m.kind] as MotionDef).computedFields?.[k]?.(m, delegates);
}

/// Gets the non-base motion fields associated with a given motion kind.
export type FieldProperties = {
    /** The type of input. This is typically directly associated with some component.
     * 
     * See `getComponent` in `"$lib/motions/sort"`.
    */
    input: InputKind,
    /** The schema used to validate the input. */
    schema: z.ZodType,
    /** Whether the field is sortable. */
    isSortable?: boolean,
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
        computedFields: {
            nSpeakers: m => m.totalTime / m.speakingTime,
        },
        display: m => ({
            topic: m.topic,
            totalTime: stringifyTime(m.totalTime),
            speakingTime: stringifyTime(m.speakingTime),
            nSpeakers: numSpeakersStr(m.totalTime, m.speakingTime)
        }),
        goto: "/dashboard/current-motion",
    },
    unmod: {
        label: "Unmoderated Caucus",
        fields: {
            totalTime: INPUT_KINDS.totalTime,
            isExtension: INPUT_KINDS.extension,
        },
        display: m => ({
            totalTime: stringifyTime(m.totalTime)
        }),
        goto: "/dashboard/current-motion",
    },
    rr: {
        label: "Round Robin",
        fields: {
            speakingTime: INPUT_KINDS.speakingTime,
            topic: INPUT_KINDS.text("Topic")
        },
        computedFields: {
            nSpeakers: (_, dels) => dels.filter(d => d.isPresent()).length,
            totalTime: (m, dels) => m.speakingTime * (getSortableField(m, dels, "nSpeakers") as number)
        },
        display: (m, delegates) => {
            const nSpeakers = getSortableField(m, delegates, "nSpeakers") as number;
            const totalTime = getSortableField(m, delegates, "totalTime") as number;
            return {
                topic: m.topic,
                totalTime: stringifyTime(totalTime),
                speakingTime: stringifyTime(m.speakingTime),
                nSpeakers: nSpeakers,
            };
        },
        goto: "/dashboard/current-motion",
    },
    other: {
        label: "Other",
        fields: {
            totalTime: optionalInput(INPUT_KINDS.totalTime),
            topic: optionalInput(INPUT_KINDS.text("Topic")),
        },
        display: m => ({
            topic: m.topic,
            totalTime: typeof m.totalTime === "number" ? stringifyTime(m.totalTime) : undefined,
        }),
        goto: "/dashboard/current-motion"
    },

    // Opening debate:
    open: {
        label: "Open Debate",
        group: "opening",
        fields: {},
        display: () => ({}),
        goto: "/dashboard/points-motions"
    },
    spklist: {
        label: "Open Speakers List",
        group: "opening",
        fields: {
            speakingTime: INPUT_KINDS.speakingTime,
        },
        display: m => ({
            speakingTime: stringifyTime(m.speakingTime),
        }),
        goto: "/dashboard/speaker-list"
    },
    agenda: {
        label: "Set Agenda",
        group: "opening",
        fields: {
            topicOrder: INPUT_KINDS.text("Topic Order", ["1 \u2192 2", "2 \u2192 1"]),
        },
        display: m => ({
            topic: m.topicOrder,
        }),
        goto: "/dashboard/points-motions"
    },
    // Voting
    introdoc: {
        label: "Introduce Documents",
        group: "voting",
        fields: {
            order: INPUT_KINDS.text("Introduction Order", ["Received", "Reverse"]),
            readingPeriodTime: INPUT_KINDS.time("Reading Period Time"),
            authorsPanelTime: INPUT_KINDS.time("Author's Panel Time"),
            qnaTime: INPUT_KINDS.time("Q&A Time"),
        },
        display: m => ({
            docOrder: m.order,
            docRp: stringifyTime(m.readingPeriodTime),
            docAp: stringifyTime(m.authorsPanelTime),
            docQna: stringifyTime(m.qnaTime),
        }),
        goto: "/dashboard/authors-panel"
    },
    amendments: {
        label: "Introduce Amendments",
        group: "voting",
        fields: {},
        display: () => ({}),
        goto: "/dashboard/points-motions"
    },
    divq: {
        label: "Divide the Question",
        group: "voting",
        fields: {},
        display: () => ({}),
        goto: "/dashboard/points-motions"
    },
    vp: {
        label: "Enter Voting Procedure",
        group: "voting",
        fields: {
            method: INPUT_KINDS.text("Method", ["Placard", "Acclamation", "Roll Call"]),
        },
        display: m =>({
            vpMethod: m.method,
        }),
        goto: m => m.method === "Roll Call"
            ? "/dashboard/vp-roll-call"
            : "/dashboard/current-motion"
    },
    // Closing
    suspend: {
        label: "Suspend Debate",
        group: "closing",
        fields: {},
        display: () => ({}),
        goto: "/dashboard/points-motions"
    },
    adjourn: {
        label: "Adjourn Debate",
        group: "closing",
        fields: {},
        display: () => ({}),
        goto: "/dashboard/points-motions"
    },
    
} satisfies { [K in MotionKind]: MotionDefOf<K> };

/** List of every motion (as defined in `MOTION_DEFS` above). */
const MOTION_KINDS = ["mod", "unmod", "rr", "other", "spklist", "agenda", "introdoc", "open", "suspend", "adjourn", "amendments", "divq", "vp"] as const satisfies readonly MotionKind[];
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
    { kind: ["adjourn", "suspend"], order: [] },
    { kind: ["vp", "divq"], order: [] },
    { kind: ["introdoc", "amendments"], order: [] },
    { kind: ["ext"], order: [{ property: "totalTime", ascending: false }] },
    { kind: ["unmod"], order: [{ property: "totalTime", ascending: false }] },
    { kind: ["mod", "rr"], order: [{ property: "nSpeakers", ascending: false }, { property: "totalTime", ascending: false }] },
    // <-- Everything else is presumed to be here -->
];

export function getSortLabel(k: SortKind) {
    return (MOTION_DEFS as Record<string, { label: string } | undefined>)[k]?.label 
        ?? (SORT_KIND_EXTRAS_NAMES as Record<string, string>)[k];
}

function arrayIntersect_<T>(arrays: Iterable<T>[]): T[] {
    if (arrays.length == 0) return [];
    const isxSet = arrays.map(it => new Set(it))
        .reduce((acc, set) => acc.intersection(set));
    return Array.from(isxSet);
}
function getAllMotionSortableKeys(k: MotionKind): string[] {
    const def: MotionDef = (MOTION_DEFS as Record<MotionKind, MotionDef>)[k];
    const sortableFields = Object.entries(def.fields)
        .filter(([_, f]) => f.isSortable)
        .map(([k, _]) => k);
    const computedFields = Object.keys(def.computedFields ?? {});
    return [...sortableFields, ...computedFields];
}
export function getAllSortableKeys(...ks: SortKind[]): string[] {
    const kinds: MotionKind[] = [];
    for (const k of ks) {
        if (k === "ext") {
            const extensionKeys = Object.entries(MOTION_DEFS)
                .filter(([_, d]) => hasKey(d.fields, "isExtension"))
                .map(([k, _]) => k as MotionKind);
            kinds.push(...extensionKeys);
        } else {
            kinds.push(k);
        }
    }

    return arrayIntersect_(Array.from(kinds, k => getAllMotionSortableKeys(k)));
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

/**
 * Creates a "comparator" for motions, using the provided sort order.
 * 
 * A comparator is a function that "compares" two motions. This can be directly input to 
 * `Array.sort` to sort an array of motions. For example,
 * 
 * ```ts
 * const motions: Motion[] = [ ... ];
 * const comparator = compareMotions(...);
 * 
 * motions.sort(comparator);
 * ```
 * 
 * @param priority the sort order to use.
 * @param delegates the list of delegates.
 * @returns the comparator
 */
export function compareMotions(priority: SortOrder, delegates: Delegate[]): Comparator<Motion> {
    return baseCompareMotions(priority, (m, k) => getSortableField(m, delegates, k));
}