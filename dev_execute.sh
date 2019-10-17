#!/bin/bash

# dev script to launch all of scipnet's parts
cd backend
npm run server &
npm run pagereq &
cd ..
./ftml-json/target/release/ftml-json ftml-json/misc/config.toml &

# TODO: deepwell, et cetera
