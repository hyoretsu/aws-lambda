#!/bin/bash

rm -rf dist
mkdir dist

for path in "$@"; do
	project=$(basename "$path" | sed 's/\.[^.]*$//')
	echo "Deploying '$project'"
	7za a "dist/$project.zip" "build/$project/index.mjs"
	echo -e "Uploading to AWS...\n"
	aws lambda update-function-code --function-name "$project" --zip-file fileb://dist/$project.zip
done
