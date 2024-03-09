import { build } from "esbuild";
import { dependencies } from "./package.json";

const start = Date.now();

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
	}).then(() => console.log("⚡ " + "\x1b[32m" + `Done in ${Date.now() - start}ms` + "\x1b[0m"));
} catch (e) {
	console.log(e);
	process.exit(1);
}
