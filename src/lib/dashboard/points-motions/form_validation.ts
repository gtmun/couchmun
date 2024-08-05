import delegates from "$lib/sample_delegates.json";
import { parseTime } from "$lib/time";
import { object, string, number } from 'yup';

export const motionSchema = object({
    delegate: string()
        .label("delegate")
        .trim()
        .required()
        .oneOf(Object.keys(delegates), "'${originalValue}' is not a present delegate"),
    kind: string()
        .label("motion kind")
        .trim()
        .required()
        .oneOf(["mod", "unmod", "other"]),
    totalTime: number()
        .label("total time")
        .required()
        .integer()
        .positive()
        .transform((val, origVal, ctx) => ctx.isType(val) ? val : parseTime(origVal))
        .required("${path} is not a valid time string (mm:ss)"),
    speakingTime: number()
        .label("speaking time")
        .when("kind", ([kind], schema) => {
            if (kind === "mod") {
                return schema
                    .required()
                    .integer()
                    .positive()
                    .transform((val, origVal, ctx) => ctx.isType(val) ? val : parseTime(origVal))
                    .required("${path} is not a valid time string (mm:ss)")
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
                return schema
                    .transform((val, _, ctx) => ctx.isType(val) ? val : undefined)
                    .notRequired();
            }
        }),
    topic: string()
        .trim()
        .required()
});
