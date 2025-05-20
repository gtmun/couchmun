/**
 * Flag URLs via FlagCDN.
 */

let FLAG_CODES: Record<string, string> = {};
export async function getFlagCodes(): Promise<typeof FLAG_CODES> {
    if (Object.keys(FLAG_CODES).length > 0) return FLAG_CODES;

    return FLAG_CODES = (
        await fetch("https://flagcdn.com/en/codes.json")
        .then(r => r.json())
        .catch(e => {})
    );
}

/**
 * Gets the flag URL associated with a given ISO 3166-1 alpha-2 code.
 * 
 * `getFlagCodes()` should be called at some point before this function is called.
 * 
 * @param key The two-letter code
 * @param validate Whether to validate this code exists before synthesizing URL
 * @returns the URL, if it exists
 */
export function getFlagUrl(key: string, validate: boolean = true): URL | undefined {
    if (!validate || key.toLowerCase() in FLAG_CODES) {
        return new URL(key.toLowerCase() + ".svg", "https://flagcdn.com/");
    }
}