# Makefile
#
# scipnet - SCP Hosting Platform
# Copyright (C) 2019 not_a_seagull
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program. If not, see <http://www.gnu.org/licenses/>.

ARTIFACTS := \
	ftml-json/target/release/ftml-json \
	client/dist/404.js \
	server/dist/index.js

program: $(ARTIFACTS)

ftml-json/target/release/ftml-json: ftml-json/Cargo.toml ftml-json/src/*
	cd ftml-json && cargo build --release

client/dist/404.js:
	@echo TODO client

#client/dist/404.js: client/package.json client/*
#	cd server && npm run babel -- client --out-dir dist/client

server/dist/index.js: server/package.json server/* server/**/*
	cd server && npm run gulp
