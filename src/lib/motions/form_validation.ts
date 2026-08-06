/**
 * Implements form validation for motions.
 */

import { z } from "zod";

import { findDelegate, type Delegate } from "$lib/db/delegates";
import type { Is } from "$lib/motions/types";
import type { DelegateID } from "$lib/types";
import { parseTime, stringifyTime } from "$lib/util/time";

export type SchemaInput<F extends (...args: any) => any> = z.input<ReturnType<F>>;
export type SchemaOutput<F extends (...args: any) => any> = z.output<ReturnType<F>>;
// Checks the given schema accepts input of type `Input` and accepts output of type `Output`.
type MatchesIO<F extends (...args: any) => any, Input, Output> =
    Is<SchemaInput<F>, Input> extends true ?
        Is<SchemaOutput<F>, Output> extends true ? true : false
    : false;

export function formatValidationError(error: z.ZodError) {
    return error.issues[0];
}

/**
 * Similar to `z.optional`, but also maps empty strings to `undefined`.
 * @param schema Any schema which accepts strings.
 * @returns A schema which ignores `undefined` and blanks, passing them as `undefined`s.
 */
export function optional<T extends z.ZodType<unknown, string>>(schema: T) {
    const filter_non_empty = (s?: string): (z.input<T> | undefined) => {
        if (typeof s === "string" && s.trim().length > 0) {
            // @ts-expect-error Cannot assert z.input<T> is string
            return s;
        }
    };
    return z.codec(
        z.optional(z.string()),
        z.optional(schema),
        {
            decode: filter_non_empty,
            encode: filter_non_empty
        }
    );
}
export function stringSchema(label: string) {
    const error = `${label} is a required field`;
    return z.string({ error })
        .trim()
        .min(1, { error });
}

/**
 * @returns a schema which can convert strings to and from integers.
 */
export function stringToIntSchema() {
    // https://zod.dev/codecs?id=stringtoint
    return z.codec(
        z.string().regex(z.regexes.integer), 
        z.int(), 
        {
            decode: (str) => Number.parseInt(str, 10),
            encode: (num) => num.toString(),
        }
    );
}
const _assertSchema0: MatchesIO<typeof stringToIntSchema, string, number> = true;

/**
 * Creates a schema that requires the input is the name of a present delegate.
 * This also transforms the input to the key of the delegate.
 * 
 * @param delegates record of delegates and their presence
 * @returns the schema
 */
export function presentDelegateSchema(delegates: Delegate[]) {
    return z.codec(
        stringSchema("Delegate name"),
        z.number(),
        {
            decode: (name, ctx) => {
                const del = delegates.find(d => d.nameEquals(name));
                if (!del) {
                    ctx.issues.push({
                        code: 'custom',
                        input: name,
                        message: `${name} is not a delegate`
                    })

                    return z.NEVER;
                } else if (!del.isPresent()) {
                    ctx.issues.push({
                        code: 'custom',
                        input: name,
                        message: `${del.name} is not a present delegate`
                    })

                    return z.NEVER;
                } else {
                    return del.id;
                }
            },
            encode: (id, ctx) => {
                const del = findDelegate(delegates, id);
                if (!del) {
                    ctx.issues.push({
                        code: "custom",
                        input: id,
                        message: `${id} is not a valid delegate ID`
                    })

                    return z.NEVER;
                }

                return del.name;
            }
        }
    );
}
const _assertSchema1: MatchesIO<typeof presentDelegateSchema, string, DelegateID> = true;

export function timeSchema(label: string) {
    return z.codec(
        stringSchema(label),
        z.number(),
        {
            decode: (input, ctx) => {
                const time = parseTime(input);
                if (typeof time === "number") {
                    return time;
                } else {
                    ctx.issues.push({
                        code: "custom",
                        input,
                        message: `${label} is not a valid time string (mm:ss)`
                    })
                    return z.NEVER;
                }
            },
            encode: out => stringifyTime(out) ?? ""
        }
    );
}
const _assertSchema2: MatchesIO<typeof timeSchema, string, number> = true;

export type Refine = readonly [check: (o: any) => boolean, z.core.$ZodCustomParams];
export function refineSpeakingTime(totalTimeAttr = "totalTime", speakingTimeAttr = "speakingTime") {
    return [(o: any) => {
        const totalTime: number = o[totalTimeAttr];
        const speakingTime: number = o[speakingTimeAttr];
        return totalTime % speakingTime == 0;
    }, {
        message: "Total time cannot be evenly divided among speakers",
        path: [speakingTimeAttr]
    }] as const satisfies Refine;
}
