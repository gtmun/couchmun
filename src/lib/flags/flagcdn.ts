const FLAG_CODES: Record<string, string> = 
    await fetch("https://flagcdn.com/en/codes.json")
    .then(r => r.json())
    .catch(e => ({}));

export function getFlagUrl(key: string): URL | undefined {
    if (key.toLowerCase() in FLAG_CODES) {
        return new URL(key.toLowerCase() + ".svg", "https://flagcdn.com/");
    }
}