#!/bin/bash

# infra.sh - Manage Terraform infrastructure and deployment
#
# Usage:
#   ./infra.sh destroy         # Destroys the infrastructure with confirmation
#   ./infra.sh force-destroy   # Destroys the infrastructure without confirmation (auto-approve)
#   ./infra.sh apply           # Provisions infrastructure, updates secrets, waits for SSH, and (optionally) runs deployment
#
# Make sure you are in the 'deploy' directory or adjust paths accordingly.
#
# Example:
#   cd deploy
#   chmod +x infra.sh
#   ./infra.sh apply
#   ./infra.sh destroy
#   ./infra.sh force-destroy

set -e

ACTION="$1"

update_env_deploy() {
    local ip="$1"
    sed -i '' "s/^PUBLIC_IP=.*/PUBLIC_IP=$ip/" .env.deploy
}

update_portfolio_key() {
    local key="$1"
    echo -e "$key" > portfolio-key.pem
    chmod 600 portfolio-key.pem
}

wait_for_ssh() {
    local ip="$1"
    local key_file="$2"
    local user="ubuntu"
    echo "[INFO] Waiting for SSH to become available at $ip..."
    sleep 120
    while ! ssh -o StrictHostKeyChecking=no -i "$key_file" -o ConnectTimeout=10 $user@$ip 'echo SSH is up' 2>/dev/null; do
        echo "[WARN] SSH not available yet. Retrying in 60 seconds..."
        sleep 60
    done
    echo "[INFO] SSH is now available."
}

if [[ "$ACTION" == "destroy" ]]; then
    echo "[INFO] Running: terraform destroy"
    cd terraform && terraform destroy
elif [[ "$ACTION" == "force-destroy" ]]; then
    echo "[INFO] Running: terraform destroy -auto-approve"
    cd terraform && terraform destroy -auto-approve
elif [[ "$ACTION" == "apply" ]]; then
    echo "[INFO] Running: terraform apply -auto-approve"
    cd terraform && terraform apply -auto-approve
    echo "[INFO] Extracting outputs..."
    terraform output -json > ../terraform-outputs.json
    cd ..
    PUBLIC_IP=$(jq -r '.public_ip.value' terraform-outputs.json)
    PRIVATE_KEY=$(jq -r '.private_key.value' terraform-outputs.json)
    update_env_deploy "$PUBLIC_IP"
    update_portfolio_key "$PRIVATE_KEY"
    wait_for_ssh "$PUBLIC_IP" "portfolio-key.pem"
    # echo "[INFO] Running deploy.sh..."
    # ./deploy.sh
else
    echo "Usage: $0 [apply|destroy|force-destroy]"
    exit 1
fi 