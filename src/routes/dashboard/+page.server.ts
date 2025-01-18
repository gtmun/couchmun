/**
 * 308: Permanently redirect /dashboard/ to /dashboard/roll-call.
 * 
 * This is where users should start for the dashboard.
 */

import { base } from "$app/paths";
import { redirect } from "@sveltejs/kit";

export function load() {
    throw redirect(308, `${base}/dashboard/roll-call`);
}