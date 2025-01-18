# Delegate Presets

This folder contains presets for delegate rosters and utilities for managing those rosters. In particular, this folder contains:

- `index.ts`, a module that provides some utilities for handling presets
- `preset-xx.json`, the preset data files

Additional delegate rosters can be defined by creating a new file `preset-KEY.json` to this folder and adding an entry for `KEY` in the `PRESETS` const of `index.ts`.
