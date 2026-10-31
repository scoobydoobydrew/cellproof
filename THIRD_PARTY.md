# Third-party dependencies

All are installed from PyPI as declared dependencies (pinned in `pyproject.toml`), none is vendored.
Licenses below were read from each package's installed metadata on 2026-10-29.

| Package | Version | License (from package metadata) | Source | Role |
|---|---|---|---|---|
| openai | 3.41.0 | Apache-2.0 | https://github.com/openai/openai-python | SDK used to call the Meta Model API (OpenAI-compatible) |
| pydantic | 2.14.1 | MIT | https://github.com/pydantic/pydantic | Structured claim and rule schemas |
| typer | 0.27.3 | MIT | https://github.com/fastapi/typer | CLI |
| rich | 15.0.0 | MIT | https://github.com/Textualize/rich | Terminal tables |
| python-dotenv | 1.2.4 | BSD-3-Clause | https://github.com/theskumar/python-dotenv | Loads `.env` |
| clingo | 5.8.2 | MIT | https://github.com/potassco/clingo | ASP solver |
| z3-solver | 5.3.2.0 | MIT | https://github.com/Z3Prover/z3 | SMT solver |
| mpbn | 4.4 | CeCILL | https://github.com/bnediction/mpbn | Most-permissive Boolean network analysis |
| biodivine_aeon | 1.4.2 | MIT | https://pypi.org/project/biodivine-aeon/ | Boolean network symbolic analysis |
| pyboolnet | 3.0.16 | LGPL (trove classifier) | https://github.com/hklarner/pyboolnet | Trap spaces, model checking |
| openpyxl | 3.1.5 | MIT | https://openpyxl.readthedocs.org | Reads Supplementary Table S2 of the base network paper |
| pytest | 9.2.0 | MIT | https://github.com/pytest-dev/pytest | Tests (dev only) |

## Services

- Meta Model API (`https://api.meta.ai/v1`), Standard model IDs only (never `-contributor`).

## Data and models

- Base Boolean network (chosen by the human on 2026-10-29): Gupta S, Panda PK, Silveira DA, Ahuja R,
  Hashimoto RF. "Quadra-stable Dynamics of p53 and PTEN in the DNA Damage Response". Cells 2023;12(7):1085,
  doi 10.3390/cells12071085. Article license CC BY 4.0; the supplement's license is not stated separately.
  Rules taken from Supplementary Table S2 into `data/base/gupta2023.bnet` with attribution in its header.
  Node count counted from the file: 30 (1 input + 29 rules). Supplement obtained via the Europe PMC REST API.
- Open-access paper corpus (Europe PMC REST API, open-access subset): the papers, their Creative Commons licences
  (CC BY, CC BY-NC, CC BY-NC-SA, CC BY-NC-ND, CC0, per paper) and the queries that selected them are listed in
  `data/corpus/manifest.json`. The full texts are downloaded by `cellproof corpus` into `data/raw/corpus` (git-ignored)
  and are not redistributed; the committed LLM cache stores long prompts as a hash, not as text. Texts are sent to the
  Meta Model API (Standard, not contributor) only for mechanism extraction.
- HGNC gene nomenclature (https://www.genenames.org, REST API, data released under CC0): approved symbols, aliases and
  previous symbols used to map names in extracted claims to genes. The responses used are cached in
  `data/ontology/hgnc_cache.json` so that grounding runs offline.
- NCBI E-utilities (`efetch`, db=pmc): full text of three held-out source papers that Europe PMC would not serve; the text
  is used only to find and check quotes and is not stored in the repository.
- Held-out source papers (`data/heldout`, seven papers, listed with their licences in the item file): only short
  factual claims with a locator are kept; no text is copied.

## Built outside Python (cloned and compiled, never vendored or committed)

`scripts/physiboss_setup.sh` clones PhysiBoSS into `~/cellproof_external` (outside this repository, in WSL or any Linux) and
builds it with g++ and make; no sudo and no new Python dependency (the tissue and ChEMBL steps use the standard library only).
Licences were read from the `licenses/` folder of the PhysiBoSS checkout on 2026-10-31 (the GitHub licence field of the
repository is empty).

| Component | Version | License | Source | Role |
|---|---|---|---|---|
| PhysiBoSS | 2.2.3 (tag v2.2.3, commit 514efcfce9d099f800e1d6cef1aa59a6f45b27c5) | BSD 3-Clause (it is an add-on of PhysiCell) | https://github.com/PhysiBoSS/PhysiBoSS | Simulator of many cells in which each cell runs a MaBoSS Boolean network (Ponce-de-Leon et al., npj Syst Biol Appl 2023) |
| PhysiCell | 1.14.0, inside PhysiBoSS | BSD 3-Clause, Copyright 2016-2021 Paul Macklin and the PhysiCell Project | https://github.com/MathCancer/PhysiCell | Agent-based cell simulator |
| BioFVM | inside PhysiBoSS | BSD 3-Clause, Copyright 2015-2021 Paul Macklin and the BioFVM Project | (same) | Diffusion solver (unused here: no substance diffuses in these runs) |
| pugixml | inside PhysiBoSS | MIT, Copyright 2006-2015 Arseny Kapoulkine | https://pugixml.org | XML reader |
| libMaBoSS | MaBoSS v2.5.6, prebuilt `libMaBoSS-linux64.tar.gz` (4,494,731 bytes, sha256 `15b27c676f02b2c0c0689de066716c0c38ea9451e62b37e614e4b5c33dc2f636`) | BSD 3-Clause, Copyright 2011-2023 Institut Curie | https://github.com/sysbio-curie/MaBoSS/releases/tag/v2.5.6 | Stochastic Boolean engine. PhysiBoSS's own build downloads it and does not check a checksum; the one above was computed on 2026-10-31 |

Two files of ours are copied over the PhysiBoSS build: `src/cellproof/tissue/physiboss/custom.cpp` and `custom.h`. Their calls
follow the template project of PhysiCell; nothing else of PhysiCell's code is in this repository. The settings file of each
run is made at run time by patching the one of PhysiBoSS's cell-lines sample, read from the installed copy.

## More services and data

- ChEMBL web services (`https://www.ebi.ac.uk/chembl/api/data`, no key). Data licence: Creative Commons Attribution-ShareAlike
  3.0 Unported (as stated in the ChEMBL interface documentation, read 2026-10-31). `results/compounds.json` is a small snapshot
  (record counts and the five most potent records per protein, with their ChEMBL ids) and therefore carries the same terms:
  attribute ChEMBL and share alike. The ChEMBL release is stored in the file.
- Literature check of PTEN and RB loss (`docs/literature_check.md`): 24 open-access papers found through the Europe PMC REST API under a fixed
  protocol and one amendment; their licences (CC BY, CC0, CC BY-NC, CC BY-NC-SA or CC BY-NC-ND, per paper) are in `data/literature/pten_rb_evidence.json`.
  Only quotes of at most 40 words, with attribution, are kept. No quote is taken from a paper under a NoDerivatives or ShareAlike licence (all of those
  were set aside as off topic). Two quotes come from one CC BY-NC paper (PMC6267624, Ma et al. 2018): they are short, attributed and used in a
  non-commercial research prototype; remove them if the repository is ever reused commercially. The full texts are in `data/raw/literature`
  (git-ignored) and are not redistributed.
- HGNC (REST `fetch/symbol`, CC0): symbol, name, HGNC id, locus group and UniProt ids of the genes in the solver's sets, cached in
  `data/ontology/hgnc_targets.json`.

## Considered and not used

- DrugBank: academic downloads need an application and its terms do not allow redistributing the data (terms read on
  2026-10-31 at trust.drugbank.com), so it could neither be committed nor reproduced by someone else.
- MSF-DTA (Ma et al., IEEE JBHI 27(4):2128-2137, 2023, doi 10.1109/JBHI.2023.3240305): no public code or weights were found
  (searched on 2026-10-31), so it could not be run. See `docs/downstream_notes.md` for why no other drug-affinity model was
  substituted.
