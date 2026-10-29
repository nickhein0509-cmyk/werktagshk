#!/usr/bin/env bash
# Runs only on trusted main. Never checks out or executes pull request code.
set -euo pipefail

if [[ -n "$(git status --porcelain)" ]]; then
  echo 'Arbeitsbaum ist nicht sauber; keine automatische Korrektur.' >&2
  exit 1
fi

git fetch --no-tags origin main
base_sha=$(git rev-parse HEAD)
if [[ "$(git rev-parse FETCH_HEAD)" != "$base_sha" ]]; then
  echo 'main hat sich seit dem Start geändert; nächster Lauf versucht es erneut.' >&2
  exit 1
fi

node scripts/context-index.mjs --write
if git diff --quiet -- docs/generated-product-index.md; then
  echo 'Produktindex ist aktuell; kein PR erforderlich.'
  exit 0
fi
if [[ -z "${GH_TOKEN:-}" ]]; then
  echo 'WERKTAG_INDEX_REPAIR_TOKEN fehlt; Korrektur-PR wurde nicht erstellt.' >&2
  exit 1
fi

# Leave an already open repair PR alone; it may contain newer human work.
open_prs=$(gh pr list --base main --state open --limit 100 --json headRefName --jq '.[] | select(.headRefName | startswith("automation/product-index-")) | .headRefName')
if [[ -n "$open_prs" ]]; then
  echo 'Ein Index-Korrektur-PR ist bereits offen; keine parallele Änderung.'
  exit 0
fi

if [[ ! "${GITHUB_RUN_ID:-}" =~ ^[0-9]+$ || ! "${GITHUB_RUN_ATTEMPT:-}" =~ ^[0-9]+$ ]]; then
  echo 'GitHub-Laufkennung fehlt oder ist ungültig.' >&2
  exit 1
fi
branch="automation/product-index-${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}"
git diff --check -- docs/generated-product-index.md
git switch -c "$branch"
git add -- docs/generated-product-index.md
if [[ "$(git diff --cached --name-only)" != 'docs/generated-product-index.md' ]]; then
  echo 'Unerwartete Dateien im Index; Abbruch.' >&2
  exit 1
fi
git config user.name 'github-actions[bot]'
git config user.email '41898282+github-actions[bot]@users.noreply.github.com'
git commit -m 'chore: regenerate product context index'
# Recheck main immediately before the push. A later change is caught by normal CI.
git fetch --no-tags origin main
if [[ "$(git rev-parse FETCH_HEAD)" != "$base_sha" ]]; then
  echo 'main hat sich geändert; kein Branch wurde hochgeladen.' >&2
  exit 1
fi
git push origin "HEAD:refs/heads/$branch"
body_file=$(mktemp)
trap 'rm -f "$body_file"' EXIT
cat > "$body_file" <<'BODY'
Aktualisiert ausschließlich den generierten Produktindex anhand der Produktkarte auf dem angegebenen Basisstand. Bitte die Karte und den Diff prüfen; der PR führt keinen automatischen Merge aus.

<!-- werktag-design-scope: none -->
BODY
gh pr create --base main --head "$branch" --title 'Produktindex aus Produktkarte aktualisieren' --body-file "$body_file"
