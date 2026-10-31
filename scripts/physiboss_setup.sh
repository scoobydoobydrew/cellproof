#!/usr/bin/env bash
# Builds PhysiBoSS (a pinned release of its public repository, kept outside this repository) together with this project's
# two overlay files, in WSL or any Linux. Needs only g++, make, git and python3; no sudo.
#
#   bash scripts/physiboss_setup.sh
#
# PhysiBoSS's own build downloads its prebuilt libMaBoSS (MaBoSS v2.5.6, sysbio-curie/MaBoSS release asset) the first time.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOME_DIR="${CELLPROOF_EXTERNAL:-$HOME/cellproof_external}"
TAG="v2.2.3"
COMMIT="514efcfce9d099f800e1d6cef1aa59a6f45b27c5"

mkdir -p "$HOME_DIR"
cd "$HOME_DIR"
[ -d PhysiBoSS ] || git clone --depth 1 --branch "$TAG" https://github.com/PhysiBoSS/PhysiBoSS.git
cd PhysiBoSS
if [ "$(git rev-parse HEAD)" != "$COMMIT" ]; then
  echo "PhysiBoSS is not at the pinned commit $COMMIT" >&2
  exit 1
fi

if [ ! -x PhysiBoSS_Cell_Lines ]; then
  # First build: start from the clean release (a libMaBoSS download, which is untracked, is kept) and put the generic main
  # program and Makefile of the cell-lines sample in place; the sample's own custom module is replaced just below.
  git checkout -q -- .
  git clean -fdq -e addons/PhysiBoSS/MaBoSS
  make physiboss-cell-lines-sample
fi

cp "$ROOT/src/cellproof/tissue/physiboss/custom.cpp" "$ROOT/src/cellproof/tissue/physiboss/custom.h" custom_modules/
make -j"$(nproc)"

echo "built:      $(pwd)/PhysiBoSS_Cell_Lines"
echo "sha256:     $(sha256sum PhysiBoSS_Cell_Lines | cut -d' ' -f1)"
echo "PhysiBoSS:  $TAG ($COMMIT)"
echo "libMaBoSS:  $(ls addons/PhysiBoSS/MaBoSS | tr '\n' ' ')"
