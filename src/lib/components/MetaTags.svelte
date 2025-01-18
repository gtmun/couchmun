<!-- 
  @component Component that adds special SEO tags to the webpage.

  This can be located anywhere in the `+page.svelte`,
  but it preferably should be on the top level.
-->
<script lang="ts">
    import { page } from "$app/state";

    interface Props {
        title: string;
        description?: string | undefined;
        thumbnail?: string | undefined;
    }

    let {
        title,
        description = undefined,
        thumbnail = undefined
    }: Props = $props();

    let thumbnailURL = $derived(typeof thumbnail === "string" ? new URL(thumbnail, page.url.origin) : undefined);
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
    <meta property="og:url" content={page.url.toString()}>
    <meta property="twitter:url" content={page.url.toString()}>

    <!-- Thumbnail URL tags -->
    {#if typeof thumbnailURL !== "undefined"}
        <meta property="og:image" content={thumbnailURL.toString()}>
        <meta property="twitter:image" content={thumbnailURL.toString()}>
    {/if}

    <!-- Miscellaneous -->
    <meta property="og:type" content="website">
    <meta property="twitter:card" content={typeof thumbnailURL !== "undefined" ? "summary_large_image" : "summary"}>
</svelte:head>