PY ?= python

.PHONY: test smoke verify extract label tissue targets compounds

# The two reading tasks only a person can do (M4 labels, D4 quote checks): a local page, every click saved at once.
label:
	$(PY) -m cellproof.cli label

# The extension (docs/downstream_notes.md). `tissue` needs PhysiBoSS, built once by scripts/physiboss_setup.sh in WSL or Linux;
# `compounds` calls ChEMBL. `make verify` needs neither: it reads the stored results.
tissue:
	$(PY) -m cellproof.cli tissue

targets:
	$(PY) -m cellproof.cli targets

compounds:
	$(PY) -m cellproof.cli compounds

test:
	$(PY) -m pytest -m "not live"

smoke:
	$(PY) -m cellproof.cli smoke

# Re-runs everything from the cached model outputs: no API call, no cost, same numbers. A cache miss is an error.
verify:
	$(PY) -m cellproof.cli verify

# The only target that spends money: calls the Meta Model API for any request not yet in cache/.
extract:
	$(PY) -m cellproof.cli corpus
	$(PY) -m cellproof.cli extract --kind mechanism
	$(PY) -m cellproof.cli extract --kind stimulus
	$(PY) -m cellproof.cli augment
