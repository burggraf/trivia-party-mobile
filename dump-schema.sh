#!/bin/bash

mkdir -p ./data
npx supabase db dump --linked -f ./data/public-schema.sql --schema public
