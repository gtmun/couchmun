/**
 * Implements form validation for motions.
 */

import { z } from "zod";

import { findDelegate, type Delegate } from "$lib/db/delegates";
import type { DelegateID } from "$lib/types";
import { parseTime, stringifyTime } from "$lib/util/time";

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
    return z.toZod<number>()(z.codec(
        z.string().regex(z.regexes.integer), 
        z.int(), 
        {
            decode: (str) => Number.parseInt(str, 10),
            encode: (num) => num.toString(),
        }
    ));
}

/**
 * Creates a schema that requires the input is the name of a present delegate.
 * This also transforms the input to the key of the delegate.
 * 
 * @param delegates record of delegates and their presence
 * @returns the schema
 */
export function presentDelegateSchema(delegates: Delegate[]) {
    return z.toZod<DelegateID>()(z.codec(
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
    ));
}

export function timeSchema(label: string) {
    return z.toZod<number>()(z.codec(
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
    ));
}

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
