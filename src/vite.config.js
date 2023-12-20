// vite.config.js
import { defineConfig } from 'vite';
import { terser } from 'rollup-plugin-terser';

export default defineConfig({
	build: {
		lib: {
			entry: './index.js',
			name: 'airdrop_animation',
			fileName: (format) => `airdrop_animation.${format}.js`,
			// Форматы файла, которые будут созданы: ESM, UMD, и т.д.
			formats: ['es', 'umd'],
		},
		outDir:'../',
		rollupOptions: {
			plugins: [
				terser({
					format: {
						comments: false, // удаляет комментарии
						beautify: false, // отключает форматирование
						// Опция, приводящая весь код к одной строке
						code: {
							keep_newlines: false,
							max_line_len: Infinity
						}
					}
				})
			]
		}
	}
});
