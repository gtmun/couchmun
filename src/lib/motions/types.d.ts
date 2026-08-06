import type { Motion } from "$lib/types";

//// Wacky type magic:
type Formify<T> = T extends number ? string : T;
// acts like Partial<O>, but: 
//    extends across unions,
//    stringifies any non-string parameters, and
//    allows for required values.
type Form<O extends object, Require extends keyof O = never> = O extends object
? 
    {[P in keyof O]?: Formify<O[P]> } &
    {[P in Require]:  Formify<O[P]> }
: never;
////
/**
 * Type of the motion input object.
 */
export type MotionInput = Form<Motion, "id" | "kind">;

/**
 * Checks that type A and B are identical types.
 */
export type Is<A, B, True = true, False = false> = NoInfer<A> extends B ? NoInfer<B> extends A ? True : False : False;