const UNITS = [60, 60, 24, 365, Infinity];
const MIN_SEGMENTS = 2;

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
        let secs = +segments[0];
        if (Number.isSafeInteger(secs) && secs > 0) return secs;
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
        const valid = segments.slice(0, -1).every((s, i) => /^\d+$/.test(s) && 0 <= +s && +s < UNITS[i])
            && segments.slice(-1).every(s => /^\d*$/.test(s));
        if (valid) {
            let accum = 1;
            let secs = 0;
            for (let i = 0; i < segments.length; i++) {
                secs += accum * +segments[i];
                accum *= UNITS[i];
            }

            if (Number.isSafeInteger(secs)) return secs;
        }
    }
}

/**
 * Converts the current number of seconds to a formatted string of the form mm:ss.
 * @param secs the number of seconds
 * @returns the time string, or undefined if negative or non-finite or non-integral
 */
export function stringifyTime(secs: number): string | undefined {
    secs = Math.ceil(secs);
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
        segments.push(...Array.from({ length: Math.max(0, MIN_SEGMENTS - segments.length) }, () => 0));
    }

    return segments.reverse()
        .map(n => n.toString().padStart(2, "0"))
        .join(":");
}