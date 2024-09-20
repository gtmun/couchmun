const FLAG_CODES: Record<string, string> = {};

if (Object.keys(FLAG_CODES).length === 0) {
    fetch("https://flagcdn.com/en/codes.json")
        .then(r => r.json())
        .then((r: Record<string, string>) => Object.assign(FLAG_CODES, r));
}

export function getFlagUrl(key: string): URL | undefined {
    if (key.toLowerCase() in FLAG_CODES) {
        return new URL(key.toLowerCase() + ".svg", "https://flagcdn.com/");
    }
}