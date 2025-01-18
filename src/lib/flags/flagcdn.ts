/**
 * Flag URLs via FlagCDN.
 */

import { browser } from "$app/environment";

let FLAG_CODES: Record<string, string> = {};
async function _flag_codes(): Promise<typeof FLAG_CODES> {
    if (Object.keys(FLAG_CODES).length > 0) return FLAG_CODES;

    return FLAG_CODES = (
        await fetch("https://flagcdn.com/en/codes.json")
        .then(r => r.json())
        .catch(e => {})
    );
}

/**
 * Gets the flag URL associated with a given ISO 3166-1 alpha-2 code.
 * @param key The two-letter code
 * @returns the URL, if it exists
 */
export async function getFlagUrl(key: string): Promise<URL | undefined> {
    if (!browser) return;
    if (key.toLowerCase() in await _flag_codes()) {
        return new URL(key.toLowerCase() + ".svg", "https://flagcdn.com/");
    }
}