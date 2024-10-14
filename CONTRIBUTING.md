# Contributing

Here are some useful pointers and references in case you wish to contribute to the repository!

## File Structure

Here's a brief summary of the file structure.

```text
src/
├── lib/
│   ├── components/
│   │   └── ...                # various Svelte components
│   ├── delegate-presets/
│   │   ├── index.ts           # preset utils
│   │   ├── preset-xx.json     # presets
│   │   └── ...
│   ├── motions/
│   │   ├── definitions.ts     # defs to update as new motions are added
│   │   ├── form_validation.ts # utils for motion form validation
│   │   └── sort.ts            # utils for motion sorting
│   ├── stores/
│   │   ├── index.ts           # util for declaring stores
│   │   ├── session.ts
│   │   └── settings.ts
│   ├── util/
│   │   ├── index.ts           # misc. utils
│   │   └── time.ts            # time-related utils
│   └── types.d.ts             # special declared types
└── routes/
    ├── dashboard/
    │   ├── current-motion/
    │   ├── points-motions/
    │   ├── roll-call/
    │   ├── speakers-list/
    │   └── utilities/
    └── settings/
```

Certain directories contain `README.md`s that give clarifications and more documentation for what that directory is used for.

## Scripts

These are some useful scripts defined in `package.json`.

### `npm dev`

Runs the app in the development mode.\
Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm run build` and `npm run preview`

- `npm run build`: Builds the app for production to the `build/` folder.
- `npm run preview`: Creates a server to view the built app in `build/`. Open [http://localhost:4173](http://localhost:4173) to view it in browser.

Note that it is not usually necessary to run these commands locally, as the Github Workflow that deploys the website will automatically run `npm run build` and `npm run preview`.
