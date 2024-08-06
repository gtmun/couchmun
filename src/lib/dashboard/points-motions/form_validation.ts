import type { DelegateMap } from "$lib/dashboard/types";
import { parseTime } from "$lib/time";
import { object, string, number, Schema } from 'yup';

function ignoreable<S extends Schema>(s: S): S {
    return s
        .transform((val, _, ctx) => ctx.isType(val) ? val : undefined)
        .notRequired();
}
export function createMotionSchema(delegates: DelegateMap, presentDelegates: string[]) {
    return object({
        // Note: the input is the delegate name, but is returned as the delegate key
        delegate: string()
            .label("delegate name")
            .trim()
            .transform(name => Object.keys(delegates).find(k => delegates[k].name === name) ?? null)
            .required()
            .nonNullable("'${originalValue}' is not a delegate")
            .oneOf(presentDelegates, "'${originalValue}' is not a present delegate"),
        kind: string()
            .label("motion kind")
            .trim()
            .required()
            .oneOf(["mod", "unmod", "other"]),
        totalTime: number()
            .label("total time")
            .integer()
            .positive()
            .transform((val, origVal, ctx) => ctx.isType(val) ? val : parseTime(origVal) ?? null)
            .required()
            .nonNullable("${path} is not a valid time string (mm:ss)"),
        speakingTime: number()
            .label("speaking time")
            .when("kind", ([kind], schema) => {
                if (kind === "mod") {
                    return schema
                        .integer()
                        .positive()
                        .transform((val, origVal, ctx) => ctx.isType(val) ? val : parseTime(origVal) ?? null)
                        .required()
                        .nonNullable("${path} is not a valid time string (mm:ss)")
                        .test(
                        "total-time-divisible-by-speaking-time",
                        "Total time cannot be evenly divided among speakers",
                        (speakingTime, ctx) => {
                            let totalTime: number = ctx.parent.totalTime;
                            return (
                                totalTime <= Number.MAX_SAFE_INTEGER && 
                                speakingTime <= Number.MAX_SAFE_INTEGER && 
                                totalTime % speakingTime == 0
                            );
                        }
                    )
                } else {
                    // speakingTime is not a parameter for these types:
                    return ignoreable(schema);
                }
            }),
        topic: string()
            .when("kind", ([kind], schema) => {
                if (kind === "unmod") {
                    return ignoreable(schema);
                } else {
                    return schema
                        .trim()
                        .required();
                }
            })
    });
}
