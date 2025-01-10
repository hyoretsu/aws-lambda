#!/bin/bash

rm -rf dist
mkdir dist

for path in "$@"; do
	project=$(basename "$path" | sed 's/\.[^.]*$//')
	echo "Deploying '$project'"
	cd "build/$project"
	7za a "../../dist/$project.zip" -r "index.mjs"
	echo -e "Uploading to AWS...\n"
	cd "../../"
	aws lambda update-function-code --function-name "$project" --zip-file fileb://dist/$project.zip
done
