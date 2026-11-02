"""Voice-over for the opening (#intro-master), made with Meta's open-source MMS-TTS (facebook/mms-tts-eng, CC-BY-NC 4.0).

Not part of the research pipeline: it only turns the lines of the opening into wav files, locally, once. `<break time="1.0s" />` in a line becomes silence
(the model itself does not read it). The model has one voice and no style control; the pace is the `speaking_rate` of the model, below 1.0 is slower.
Needs the optional extra: `pip install -e .[voice]`. Run: `python -m cellproof.voice [out_dir] [lang]` (default out_dir: results/voice, which the page plays).
"""
import functools
import re
import sys
import wave
from pathlib import Path

import numpy as np

BREAK = re.compile(r'<break time="([0-9.]+)s"\s*/>')

# (id, text), in the order the opening shows them. The ids are file names.
LINES_EN = [
    ("00-platform", 'A platform that helps cancer labs decide which experiments to run first. <break time="1.0s" /> A small step on the way to better cancer research.'),
    ("01-flood", 'Every week, new papers. <break time="0.7s" /> Every paper, new genes to test. <break time="0.9s" /> A lab can only run a few experiments.'),
    ("02-student", 'Too many papers. <break time="0.6s" /> Too many genes. <break time="0.8s" /> I cannot check them all.'),
    ("03-teacher", 'Ah. <break time="1.0s" /> You are too concerned, <break time="0.7s" /> about what was, <break time="0.7s" /> and what will be.'),
    ("04-teacher", 'Let the machine read. <break time="0.8s" /> Let the solver judge. <break time="1.0s" /> And you, choose what is worth the lab.'),
    ("05-teacher", 'An AI that reads what no person can finish. <break time="0.9s" /> Use it, where it can help people.'),
    ("06-feeling", 'There is a feeling you get, <break time="0.7s" /> when you believe in something, <break time="0.9s" /> before anyone else does.'),
    ("07-term", 'Solitary conviction. <break time="1.0s" /> A state where you believe in something, without having evidence, that it would work.'),
    ("08-week", 'We felt it at the start of this hackathon. <break time="0.8s" /> A platform that looked impossible, <break time="0.7s" /> to build in one week.'),
    ("09-moon", 'Shoot for the moon. <break time="1.0s" /> A treatment for cancer.'),
    ("10-stars", 'At worst, you land among the stars. <break time="0.8s" /> A platform that helps labs choose which tests to run first. <break time="1.0s" /> We did not find a cure for cancer. <break time="0.8s" /> This is a small step, on the way.'),
    ("11-card", 'CellProof. <break time="1.0s" /> From shared uncertainty, to solitary conviction. <break time="1.2s" /> The field: cancer biology, how cells respond to radiation. <break time="0.9s" /> The problem: cell models are incomplete, and nobody can check every idea from the papers by hand. <break time="0.9s" /> How it helps: an AI proposes, an exact solver checks, and researchers get candidates to test in the lab.'),
]
GAP = 0.7  # seconds between two lines on the page
MODELS = {"eng": "facebook/mms-tts-eng", "ell": "facebook/mms-tts-ell"}


@functools.lru_cache(maxsize=None)
def load(lang: str):
    from transformers import AutoTokenizer, VitsModel

    return AutoTokenizer.from_pretrained(MODELS[lang]), VitsModel.from_pretrained(MODELS[lang])


def speak(pieces: list[str], lang: str = "eng", rate: float = 0.85, seed: int = 7) -> tuple[np.ndarray, int]:
    """`pieces` are texts and `<break>` tags in order; returns mono float samples and the sampling rate."""
    import torch
    tok, model = load(lang)
    model.speaking_rate = rate
    sr, out = model.config.sampling_rate, []
    for piece in pieces:
        m = BREAK.fullmatch(piece)
        if m:
            out.append(np.zeros(int(float(m.group(1)) * sr), dtype=np.float32))
        elif piece.strip():
            torch.manual_seed(seed)  # the model is stochastic; a fixed seed makes a line repeatable
            with torch.no_grad():
                out.append(model(**tok(piece.strip(), return_tensors="pt")).waveform[0].numpy())
    return np.concatenate(out), sr


def split(text: str) -> list[str]:
    parts, last = [], 0
    for m in BREAK.finditer(text):
        parts += [text[last:m.start()], m.group(0)]
        last = m.end()
    return parts + [text[last:]]


def write_wav(path: Path, samples: np.ndarray, sr: int) -> float:
    pcm = (np.clip(samples, -1, 1) * 32767).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1), w.setsampwidth(2), w.setframerate(sr), w.writeframes(pcm.tobytes())
    return len(samples) / sr


def main() -> None:
    out = Path(sys.argv[1] if len(sys.argv) > 1 else "results/voice")
    lang = sys.argv[2] if len(sys.argv) > 2 else "eng"
    if lang != "eng":
        sys.exit("only the English lines are written; add a LINES list for another language first")
    out.mkdir(parents=True, exist_ok=True)
    starts, at = [], 0.0
    for name, text in LINES_EN:
        samples, sr = speak(split(text), lang)
        seconds = write_wav(out / f"{name}.wav", samples, sr)
        print(f"{name}: {seconds:.1f} s  (peak {np.abs(samples).max():.2f})")
        starts.append(round(at, 1))
        at += seconds + GAP
    print(f"cues for MASTER_CUES in report/web/video.js (a line starts {GAP} s after the previous one ends): {starts}")


if __name__ == "__main__":
    main()
