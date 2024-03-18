#!/bin/bash

rm -rf dist
mkdir dist
touch a.txt

shopt -s nullglob
for path in "$@"; do
	project=$(file=${path##*/}; echo ${file%.*})
	echo "Deploying '$project'"
	zip -jr "dist/$project.zip" "build/$project/index.js"
	echo -e "Uploading to AWS...\n"
	aws lambda update-function-code --function-name $name --zip-file fileb://dist/$name.zip
done
shopt -u nullglob
