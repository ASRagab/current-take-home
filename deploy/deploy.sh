#!/usr/bin/env bash

image=asragab/current

skip_docker=true

while [[ $# -gt 0 ]]; do
  key="$1"

  case ${key} in
    --with-docker)
      skip_docker=false
      shift
      ;;
  esac
  shift
done

if [ "$skip_docker" == "false" ]; then
  docker build -t ${image} .
  docker tag ${image} gcr.io/${PROJECT}/${image}
  docker push gcr.io/${PROJECT}/${image}
fi

# pull latest digest
digest=$(gcloud container images describe gcr.io/${PROJECT}/${image}:latest  --format='value(image_summary.fully_qualified_digest)')

pushd deploy/terraform
terraform apply -var "password=${DB_PASSWORD}" -var "digest=${digest}" -var "maps_api_key=${MAPS_API_KEY}"
popd

connection_name="${PROJECT}:${REGION}:${INSTANCE}"
db_name=${DB_NAME}
db_user=${DB_USER}
db_pass=${DB_PASSWORD}

socket_factory="com.google.cloud.sql.postgres.SocketFactory"
db_url="jdbc:postgresql://google/${db_name}?cloudSqlInstance=${connection_name}&socketFactory=${socket_factory}"

# run migrate
flyway migrate \
  -url=${db_url} \
  -user=${db_user} \
  -password=${db_pass} \
  -placeholders.user_name=${db_user} \
  -placeholders.user_password=${db_pass} \
  -locations=filesystem:flyway/sql/up
