#!/usr/bin/env bash
. scripts/.env

aws s3 sync client-app/build/ s3://foxhunt.ivanatora.info --acl public-read
aws cloudfront create-invalidation --distribution-id ${CF_DISTRIBUTION_ID} --paths "/*"