export type DelegateMap = {
    [code: string]: DelegateAttrs
}
export type DelegateAttrs = {
    name: string,
    aliases: string[]
}