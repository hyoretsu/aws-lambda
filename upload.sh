#!/bin/bash

rm -rf dist
mkdir dist

shopt -s nullglob
for project in build/*
do
	name="${project:6}"
	zip -r dist/$name.zip -j $project/index.js
	aws lambda update-function-code --function-name $name --zip-file fileb://dist/$name.zip
done
shopt -u nullglob
