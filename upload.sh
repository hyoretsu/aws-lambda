#!/bin/bash

rm -rf dist
mkdir dist

shopt -s nullglob
for project in build/*
do
	name="${project:6}"
	echo "Deploying '$name'"
	zip -r dist/$name.zip -j $project/index.js
	echo "Uploading to AWS..."
	echo ""
	aws lambda update-function-code --function-name $name --zip-file fileb://dist/$name.zip
done
shopt -u nullglob
