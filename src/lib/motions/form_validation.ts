import type { Delegate } from "$lib/db/delegates";
import { parseTime } from "$lib/util/time";
import { z } from "zod";

export function nonEmptyString(...params: Parameters<typeof z.string>) {
    return z.string(...params)
        .trim()
        .min(1, params[0]?.required_error);
}
export function formatValidationError(error: z.ZodError) {
    let [issue] = error.issues;
    // If union error, find the non-union related error and return it.
    //
    // Note, this should be refactored once this issue resolves:
    // https://github.com/colinhacks/zod/issues/3407
    if (issue.code === "invalid_union") {
        [issue] = issue.unionErrors.map(e => e.issues)
            .find(issues => !issues.some(i => i.code === "invalid_literal")) ?? [];
    }

    return issue;
}

/**
 * Creates a schema that requires the input is the name of a present delegate.
 * This also transforms the input to the key of the delegate.
 * 
 * @param delegates record of delegates and their presence
 * @returns the schema
 */
export function presentDelegateSchema(delegates: Delegate[]) {
    return nonEmptyString({ description: "Delegate name", required_error: "Delegate name is a required field" })
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
    return nonEmptyString({ description: label })
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
    } satisfies z.CustomErrorParams] as const;
}
export function topicSchema() {
    return nonEmptyString({ description: "Topic", required_error: "Topic is a required field" });
}
