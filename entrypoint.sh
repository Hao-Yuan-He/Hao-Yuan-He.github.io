#!/bin/sh

# Run bundle install --redownload
bundle install --redownload

# Start the Jekyll server
jekyll serve --watch --incremental --host 0.0.0.0 --port 8080