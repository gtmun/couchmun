/**
 * Implements form validation for motions.
 */

import type { Delegate } from "$lib/db/delegates";
import { parseTime } from "$lib/util/time";
import { z } from "zod";

export function nonEmptyString(label: string) {
    return z.string({
        error(issue) {
            if (typeof issue.input === "undefined" || (issue.input as string).trim().length == 0) {
                return `${label} is a required field`;
            }
        }
    })
        .trim();
}
export function formatValidationError(error: z.ZodError) {
    return error.issues[0];
}

/**
 * Creates a schema that requires the input is the name of a present delegate.
 * This also transforms the input to the key of the delegate.
 * 
 * @param delegates record of delegates and their presence
 * @returns the schema
 */
export function presentDelegateSchema(delegates: Delegate[]) {
    return nonEmptyString("Delegate name")
        .transform((name, ctx) => {
            const del = delegates.find(d => d.nameEquals(name));
            if (!del) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `${name} is not a delegate`
                })

                return z.NEVER;
            } else if (!del.isPresent()) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `${del.name} is not a present delegate`
                })

                return z.NEVER;
            } else {
                return del.id;
            }
        })
}

export function timeSchema(label: string) {
    return nonEmptyString(label)
        .transform((inp, ctx) => {
            const time = parseTime(inp);
            if (typeof time === "number") {
                return time;
            } else {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `${label} is not a valid time string (mm:ss)`
                })

                return z.NEVER;
            }
        });
}
export function refineSpeakingTime(totalTimeAttr = "totalTime", speakingTimeAttr = "speakingTime") {
    return [(o: any) => {
        let totalTime: number = o[totalTimeAttr];
        let speakingTime: number = o[speakingTimeAttr];
        return totalTime % speakingTime == 0;
    }, {
        message: "Total time cannot be evenly divided among speakers",
        path: [speakingTimeAttr]
    } satisfies z.core.$ZodCustomParams] as const;
}
export function topicSchema() {
    return nonEmptyString("Topic");
}
