#
# Makefile
#
# scipnet - SCP Hosting Platform
# Copyright (C) 2019 not_a_seagull, Ammon Smith
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
	frontend/dist/404.js \
	backend/dist/index.js

.PHONY: default prepare clean clean-all

default: $(ARTIFACTS)

prepare:
	make -C frontend prepare
	make -C backend prepare

ftml-json/target/release/ftml-json: ftml-json/Cargo.toml ftml-json/src/*
	cd ftml-json && cargo build --release

frontend/dist/404.js: frontend/package.json frontend/tsconfig.json frontend/*.js frontend/*.ts
	make -C frontend

backend/dist/index.js: backend/package.json frontend/tsconfig.json backend/src/**/*.ts
	make -C backend

clean:
	make -C frontend clean
	make -C backend clean

clean-all: clean
	cd ftml-json && cargo clean
