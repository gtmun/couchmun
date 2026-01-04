<!-- 
  @component The page for roll call, 
    which consists of a long list of delegates and an option to select NP/P/PV.
-->
<script lang="ts">
    import { resolve } from "$app/paths";
    import RollCall from "$lib/components/RollCall.svelte";
    import { getSessionContext } from "$lib/context/index.svelte";
    import { db } from "$lib/db/index.svelte";
    import type { DelegatePresence } from "$lib/types";
    import MdiAccount from "~icons/mdi/account";
    import MdiAccountCheck from "~icons/mdi/account-check";
    import MdiAccountOff from "~icons/mdi/account-off";

    const { delegates } = getSessionContext();

    function asPresence(s?: string | null): DelegatePresence {
        if (s === "P" || s === "PV") return s;
        return "NP";
    }
</script>

<!-- Render a table to display participants and their statuses -->
<RollCall
    getValue={(d) => d.presence}
    setValue={(value, d) => db.updateDelegate(d.id, { presence: asPresence(value) })}
    delegates={$delegates}
    entries={[
        { value: "NP", label: "Absent", icon: MdiAccountOff },
        { value: "P",  label: "Present", icon: MdiAccount },
        { value: "PV", label: "Present & Voting", icon: MdiAccountCheck },
    ]}
>
    {#snippet emptyPlaceholder()}
        <div class="h-full w-full flex flex-col items-stretch justify-center">
            <div class="text-center">
                <h3 class="h3">No delegates enabled.</h3>
                    Visit 
                    <a
                        class="btn btn-sm preset-tonal-warning"
                        href="{resolve("/admin/settings")}"
                        tabindex="0"
                    >
                        Settings
                    </a>
                to configure delegates.
            </div>
        </div>
    {/snippet}
</RollCall>
