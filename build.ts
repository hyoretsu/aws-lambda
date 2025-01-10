import { readdir, rmdir } from "node:fs/promises";
import { dependencies } from "./package.json";

async function execute() {
	rmdir("./build", {
		recursive: true,
	});

	const start = Date.now();

	const srcFiles = await readdir("./src");

	await Bun.build({
		entrypoints: srcFiles.reduce<string[]>((arr, content) => {
			if (content.match(/\.ts$/g)?.length > 0) {
				arr.push(`./src/${content}`);
			}

			return arr;
		}, []),
		external: [...Object.keys(dependencies).filter(pkg => pkg.startsWith("@aws-sdk"))],
		minify: true,
		naming: "[dir]/[name]/index.mjs",
		outdir: "./build",
		target: "node",
	});

	console.log(
		// biome-ignore lint/style/useTemplate:
		"⚡ " + "\x1b[32m" + `Done in ${Date.now() - start}ms` + "\x1b[0m",
	);
}

execute();
