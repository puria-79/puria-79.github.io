#!/usr/bin/env bash
set -euo pipefail

owner="${1:?owner is required}"
output_file="${2:-repos.json}"

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI is required but not found."
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required but not found."
  exit 1
fi

tmp_jsonl="$(mktemp)"
generated_at="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"

while IFS= read -r repo_b64; do
  repo_json="$(printf '%s' "$repo_b64" | base64 --decode)"

  repo_name="$(printf '%s' "$repo_json" | jq -r '.name')"
  repo_url="$(printf '%s' "$repo_json" | jq -r '.html_url')"
  description="$(printf '%s' "$repo_json" | jq -r '.description // ""')"

  if gh api "/repos/$owner/$repo_name/branches/gh-pages" >/dev/null 2>&1; then
    if [ "$repo_name" = "$owner.github.io" ]; then
      page_url="https://$owner.github.io/"
    else
      page_url="https://$owner.github.io/$repo_name/"
    fi

    jq -n \
      --arg name "$repo_name" \
      --arg repoUrl "$repo_url" \
      --arg pageUrl "$page_url" \
      --arg description "$description" \
      '{
        name: $name,
        repoUrl: $repoUrl,
        pageUrl: $pageUrl,
        description: $description
      }' >> "$tmp_jsonl"
  fi
done < <(gh api --paginate "/user/repos?per_page=100&type=owner&sort=full_name&direction=asc" --jq '.[] | @base64')

if [ -s "$tmp_jsonl" ]; then
  jq -s \
    --arg owner "$owner" \
    --arg generatedAt "$generated_at" \
    '{
      owner: $owner,
      generatedAt: $generatedAt,
      repositories: (sort_by(.name | ascii_downcase))
    }' "$tmp_jsonl" > "$output_file"
else
  jq -n \
    --arg owner "$owner" \
    --arg generatedAt "$generated_at" \
    '{
      owner: $owner,
      generatedAt: $generatedAt,
      repositories: []
    }' > "$output_file"
fi

rm -f "$tmp_jsonl"
