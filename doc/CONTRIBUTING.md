# Contributing

Here are some useful pointers and references in case you wish to contribute to the repository!

## Dependencies

This project uses [SvelteKit](https://kit.svelte.dev) and [TypeScript](https://www.typescriptlang.org). Refer to those docs to learn more about Svelte, SvelteKit, and TypeScript.

You also need Node (or `yarn` or `pnpm`) to run the project. You can do `npm install` to install all required dependencies.

Once you have all required dependencies, you can use the following scripts:

### `npm run dev`

Runs the app in the development mode.
Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

The page will reload if you make edits.
You will also see any lint errors in the console.

### `npm run build` and `npm run preview`

- `npm run build`: Builds the app for production to the `build/` folder.
- `npm run preview`: Creates a server to view the built app in `build/`. Open [http://localhost:4173](http://localhost:4173) to view it in browser.

Note that it is not usually necessary to run these commands locally, as the Github Workflow that deploys the website will automatically run `npm run build`.

This script is mainly only useful when you find a bug in the deployed website that you can't reproduce with the `npm run dev` build. If you find a bug you can't reproduce, try doing `npm run build && npm run preview`.

## Making Changes

This GitHub repository is the source of all changes and updates:

- Use the GitHub [issues](https://github.com/gtmun/couchmun/issues) page to post any bug reports or feature requests.
- Use the GitHub [pull request](https://github.com/gtmun/couchmun/pulls) page to submit a change to the repository.
