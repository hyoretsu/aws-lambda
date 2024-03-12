import { readdir, rmdir } from 'node:fs/promises';
import { dependencies } from "./package.json";

async function execute() {
	rmdir("./build", {
		recursive: true,
	});

	const start = Date.now();

	await Bun.build({
		entrypoints: (await readdir("./src")).map(entry => `./src/${entry}`),
		external: [...Object.keys(dependencies).filter(pkg => pkg.startsWith("@aws-sdk"))],
		minify: true,
		naming: "[dir]/[name]/index.[ext]",
		outdir: "./build",
		target: "node",
	});

	console.log(
		// biome-ignore lint/style/useTemplate:
		"⚡ " + "\x1b[32m" + `Done in ${Date.now() - start}ms` + "\x1b[0m",
	);
}

execute();
