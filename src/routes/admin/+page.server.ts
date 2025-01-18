/**
 * 307: Temporary redirect /admin/ to /admin/settings.
 * 
 * There is probably a universe where we make a new /admin/ page
 * and won't redirect to /admin/settings/.
 */

import { base } from "$app/paths";
import { redirect } from "@sveltejs/kit";

export function load() {
    throw redirect(307, `${base}/admin/settings`);
}