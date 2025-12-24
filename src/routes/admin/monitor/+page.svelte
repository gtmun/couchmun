<script lang="ts">
    import BarStats from "$lib/components/app-bar/BarStats.svelte";
import RollCall, { notPendingThen } from "$lib/components/RollCall.svelte";
    import SpeakerList from "$lib/components/SpeakerList.svelte";
    import { getSessionContext } from "$lib/context/index.svelte";
    import { db } from "$lib/db/index.svelte";
    import type { DelegatePresence } from "$lib/types";
    import MdiAccount from "~icons/mdi/account";
    import MdiAccountCheck from "~icons/mdi/account-check";
    import MdiAccountOff from "~icons/mdi/account-off";
    import MdiSearch from "~icons/mdi/search";

    const { speakersList: order } = getSessionContext();
    const delegates = db.enabledDelegatesStore();
    
    let rollCallSearch = $state("");
    function asPresence(s?: string | null): DelegatePresence {
        if (s === "P" || s === "PV") return s;
        return "NP";
    }
    const rcDelegates = $derived(notPendingThen($delegates, dels => dels.filter(d => d.nameIncludes(rollCallSearch))));

</script>
<div class="grid grid-cols-2 gap-3 h-full">
    <!-- Roll Call -->
    <div class="flex flex-col gap-1 overflow-hidden">
        <h3 class="h3 text-center">Roll Call</h3>
        <BarStats total={$delegates.filter(d => d.isPresent()).length} />
        <div class="flex gap-2 items-center">
            <MdiSearch />
            <input class="input" bind:value={rollCallSearch} placeholder="Search...">
        </div>
        <div class="overflow-auto">
            <RollCall
                getValue={(d) => d.presence}
                setValue={(value, d) => db.updateDelegate(d.id, { presence: asPresence(value) })}
                delegates={rcDelegates}
                entries={[
                    { value: "NP", label: "Absent", icon: MdiAccountOff },
                    { value: "P",  label: "Present", icon: MdiAccount },
                    { value: "PV", label: "Present & Voting", icon: MdiAccountCheck },
                ]}
            />
        </div>
    </div>
    <!-- Speakers List -->
    <div class="flex flex-col gap-1 overflow-hidden">
        <!-- List -->
        <SpeakerList
            delegates={$delegates}
            bind:order={$order}
        />
    </div>
</div>