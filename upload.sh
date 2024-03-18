#!/bin/bash

rm -rf dist
mkdir dist

shopt -s nullglob
for project in $@; do
	name="${project:4:-3}"
	echo "Deploying '$name'"
	zip -jr "dist/$name.zip" "build/$name/index.js"
	echo -e "Uploading to AWS...\n"
	aws lambda update-function-code --function-name $name --zip-file fileb://dist/$name.zip
done
shopt -u nullglob
