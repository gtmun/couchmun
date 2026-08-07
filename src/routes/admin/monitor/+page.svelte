<script lang="ts">
    import BarStats from "$lib/components/app-bar/BarStats.svelte";
    import RollCall from "$lib/components/RollCall.svelte";
    import SearchInput from "$lib/components/SearchInput.svelte";
    import SpeakerList from "$lib/components/SpeakerList.svelte";
    import { getSessionContext } from "$lib/context/index.svelte";
    import { countPresentDelegates, delegateSearch } from "$lib/db/delegates";
    import { db } from "$lib/db/index.svelte";
    import type { DelegatePresence } from "$lib/types";
    import MdiAccount from "~icons/mdi/account";
    import MdiAccountCheck from "~icons/mdi/account-check";
    import MdiAccountOff from "~icons/mdi/account-off";

    const { delegates, speakersList: order } = getSessionContext();
    
    function asPresence(s?: string | null): DelegatePresence {
        if (s === "P" || s === "PV") return s;
        return "NP";
    }
    
    let search = $derived(delegateSearch($delegates));
    let rcSearchQuery = $state("");
</script>
<div class="grid grid-cols-2 gap-3 h-full p-4 overflow-hidden">
    <!-- Roll Call -->
    <div class="flex flex-col gap-2 overflow-hidden">
        <div>
            <h3 class="h3 text-center">Roll Call</h3>
            <BarStats total={countPresentDelegates($delegates)} />
        </div>
        <SearchInput bind:value={rcSearchQuery} />
        <div class="overflow-auto grow">
            <RollCall
                getValue={(d) => d.presence}
                setValue={(value, d) => db.updateDelegate(d.id, { presence: asPresence(value) })}
                delegates={search.query(rcSearchQuery)}
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