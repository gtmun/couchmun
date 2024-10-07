const UNITS = [60, 60, 24, 365, Infinity];
const PADDING = [2, 2, 2, 3, undefined];
const MIN_SEGMENTS = 2;

const NUM_REGEX = /^\d+$/;

function _safeInteger(n: number): number | undefined {
    if (Number.isSafeInteger(n) && n >= 0) return n;
}
/**
 * Parses a time string of the format mm:ss (or optionally including days and hours)
 * into the number of seconds.
 * @param timeStr the time string
 * @returns the number of seconds, or undefined if invalid
 */
export function parseTime(timeStr: string): number | undefined {
    let segments = timeStr.split(":").reverse();
    
    // Handling seconds:
    if (segments.length === 1) {
        let [secs] = segments;
        let colonized = addColons(secs);
        
        return colonized.includes(":") ? parseTime(addColons(secs)) : _safeInteger(+colonized);
    }

    // Handling formats -- mm:ss to yy:dd:hh:mm:ss
    if (segments.length <= UNITS.length + 1) {
        // Assert every segment (except the last) is a positive integer that falls under the unit range,
        // and that the last is a positive integer or nothing
        // This allows for the following formats:
        // :45, 00:45, :30:00, 1:30:00, 0:45
        // This rejects the following formats:
        // ::45, 14:95, 25:61:61
        // Unfortunately, this doesn't handle padding, so these are accepted as well:
        // 0:1, 10:2, 23:59:5
        const valid = segments.slice(0, -1).every((s, i) => NUM_REGEX.test(s) && 0 <= +s && +s < UNITS[i])
            && segments.slice(-1).every(s => /^\d*$/.test(s));
        if (valid) {
            let accum = 1;
            let secs = 0;
            for (let i = 0; i < segments.length; i++) {
                secs += accum * +segments[i];
                accum *= UNITS[i];
            }

            return _safeInteger(secs);
        }
    }
}

/**
 * Converts the current number of seconds to a formatted string of the form mm:ss.
 * @param secs the number of seconds
 * @returns the time string, or undefined if negative or non-finite or non-integral
 */
export function stringifyTime(secs: number, roundingMode: "floor" | "round" | "ceil" = "ceil"): string | undefined {
    switch (roundingMode) {
        case "floor":
            secs = Math.floor(secs);
        case "round":
            secs = Math.round(secs);
        case "ceil":
        default:
            secs = Math.ceil(secs);
    }

    if (secs < 0) return;
    if (!Number.isSafeInteger(secs)) return;

    let segments = [];
    let n = secs;
    for (let unitCt of UNITS) {
        segments.push(n % unitCt);
        n = Math.floor(n / unitCt);
        if (n <= 0) break;
    }

    // extend to at least 2 elements:
    if (segments.length < MIN_SEGMENTS) {
        const length = Math.max(0, MIN_SEGMENTS - segments.length);
        segments.push(...Array.from({ length }, () => 0));
    }

    return stringifySegments(segments);
}

function stringifySegments(segments: number[]): string {
    return segments
        .map((n, i) => typeof PADDING[i] === "number" ? n.toString().padStart(PADDING[i], "0") : n.toString())
        .reverse()
        .join(":");
}

/**
 * Adds colons to a numeric string.
 * @param numStr the numeric string
 * @returns the numeric string with colons (or the string again if not numeric)
 */
export function addColons(numStr: string): string {
    if (typeof numStr === "undefined") return "";
    if (!NUM_REGEX.test(numStr)) return numStr;

    // Segment string
    let time = [];
    for (let u = 0, s = numStr.length; u < PADDING.length, s > 0; u++) {
        let length = typeof PADDING[u] === "number" ? Math.min(s, PADDING[u] as number) : s;

        time.push(numStr.slice(s - length, s));
        s -= length;
    }
    
    // Parse + apply carry
    time = time.map(s => +s);
    for (let u = 0; u < UNITS.length - 1 && u < time.length; u++) {
        let [d, m] = [Math.floor(time[u] / UNITS[u]), time[u] % UNITS[u]];
        time[u] = m;
        
        if (d == 0 && u == time.length - 1) break;
        time[u + 1] ??= 0;
        time[u + 1] += d;
    }

    return stringifySegments(time);
}