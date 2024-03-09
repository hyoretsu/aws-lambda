import { build } from "esbuild";
import { readFileSync, rmSync } from "fs";
import { dependencies } from "./package.json";

const start = Date.now();

rmSync("build", { recursive: true });

try {
	build({
		bundle: true,
		entryPoints: ["./src/**"],
		external: [
			...(dependencies && Object.keys(dependencies).filter(pkg => pkg.startsWith("@aws-sdk"))),
		],
		keepNames: true,
		minify: true,
		outdir: "build",
		platform: "node",
		plugins: [
			{
				name: 'jsdom-patch',
				setup(build) {
					build.onLoad({ filter: /XMLHttpRequest-impl\.js$/ }, async (args) => {
						let contents = readFileSync(args.path, 'utf8');
						contents = contents.replace(
							'const syncWorkerFile = require.resolve ? require.resolve("./xhr-sync-worker.js") : null;',
							`const syncWorkerFile = "${require.resolve('jsdom/lib/jsdom/living/xhr/xhr-sync-worker.js')}";`.replaceAll('\\', process.platform === 'win32' ? '\\\\' : '\\'),
						);
						return { contents, loader: 'js' };
					});
				},
			},
		],
	}).then(() => console.log("⚡ " + "\x1b[32m" + `Done in ${Date.now() - start}ms` + "\x1b[0m"));
} catch (e) {
	console.log(e);
	process.exit(1);
}
