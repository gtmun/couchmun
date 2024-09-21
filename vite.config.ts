import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	// Allow any usage of new JS features:
	build: {
		target: "esnext"
	},
	esbuild: {
		target: "esnext"
	},
	optimizeDeps:{
		esbuildOptions: {
			target: "esnext",
		}
	},
	
	plugins: [sveltekit()]
});
