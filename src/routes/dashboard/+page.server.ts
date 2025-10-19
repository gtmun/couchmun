/**
 * 308: Permanently redirect /dashboard/ to /dashboard/roll-call.
 * 
 * This is where users should start for the dashboard.
 */

import { redirect } from "@sveltejs/kit";

import { resolve } from "$app/paths";

export function load() {
    throw redirect(308, resolve("/dashboard/roll-call"));
}