#!/bin/bash

mkdir -p dist

shopt -s nullglob
for file in build/*
do
	name="${file:6:-3}"
	zip -r dist/$name.zip $file
	aws lambda update-function-code --function-name $name --zip-file fileb://dist/$name.zip
done
shopt -u nullglob
