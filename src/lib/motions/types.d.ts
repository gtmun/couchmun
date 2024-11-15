import type { Motion } from "$lib/types";

//// Wacky type magic:
type Formify<T> = T extends number ? string : T;
// acts like Partial<O>, but: 
//    extends across unions,
//    stringifies any non-string parameters, and
//    allows for required values.
type Form<O extends {}, Require extends keyof O = never> = O extends {} 
? 
    {[P in keyof O]?: Formify<O[P]> } &
    {[P in Require]:  Formify<O[P]> }
: never;
/**
 * Filters union type M to all options which include all entries of Fs as a field.
 */
type WithFields<M, Fs extends string> = Extract<M, Record<Fs, unknown>>;
////
/**
 * Type of the motion input object.
 */
export type MotionInput = Form<Motion, "id" | "kind">;
/**
 * Type of motion input object, filtering only the motions with the given fields.
 */
export type MotionInputWithFields<F extends string> = Form<WithFields<Motion, F>, "id" | "kind">;