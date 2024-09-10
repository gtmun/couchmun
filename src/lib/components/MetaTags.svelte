<script lang="ts">
    import { page } from "$app/stores";

    export let title: string;
    export let description: string | undefined = undefined;
    export let thumbnail: string | undefined = undefined;

    let url = $page.url;
    $: thumbnailURL = typeof thumbnail === "string" ? new URL(thumbnail, url.origin) : undefined;
</script>

<svelte:head>
    <!-- Title tags -->
    <title>{title}</title>
    <meta name="title" content={title}>
    <meta property="og:title" content={title}>
    <meta property="twitter:title" content={title}>

    <!-- Description tags -->
    {#if typeof description === "string"}
        <meta name="description" content={description}>
        <meta property="og:description" content={description}>
        <meta property="twitter:description" content={description}>
    {/if}
    
    <!-- Website URL tags -->
    <meta property="og:url" content={url.toString()}>
    <meta property="twitter:url" content={url.toString()}>

    <!-- Thumbnail URL tags -->
    {#if typeof thumbnailURL !== "undefined"}
        <meta property="og:image" content={thumbnailURL.toString()}>
        <meta property="twitter:image" content={thumbnailURL.toString()}>
    {/if}

    <!-- Miscellaneous -->
    <meta property="og:type" content="website">
    <meta property="twitter:card" content={typeof thumbnailURL !== "undefined" ? "summary_large_image" : "summary"}>
</svelte:head>