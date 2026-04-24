#!/usr/bin/env python3
"""
batch_index_and_number.py
- Scans selected folders recursively for audio files.
- Builds/updates index.json with fields:
  id,path,title,artist,genre,subtype,filetype,duration,song_number
- Detects subtype by filename/folder/tags (karaoke, remix, mtv, mp3, unknown).
- Assigns song numbers per-folder or globally using a pattern.
- Dry-run by default; use --apply to persist index and --write-tags to write
  TXXX:SongNumber for mp3.

Dependencies: mutagen, tqdm
Install: pip install mutagen tqdm
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from collections import defaultdict
from pathlib import Path

from mutagen import File
from mutagen.id3 import ID3, ID3NoHeaderError, TXXX

AUDIO_EXTS = {".mp3", ".m4a", ".flac", ".wav", ".aac", ".ogg"}
SUBTYPE_PATTERNS = {
    "karaoke": [r"\bkaraoke\b", r"\bktv\b", r"\binstrumental\b", r"\binst\b"],
    "remix": [r"\bremix\b", r"\brmx\b", r"\bedit\b", r"\bclub mix\b"],
    "mtv": [r"\bmtv\b", r"\bmv\b", r"\bvideo edit\b"],
    "mp3": [r"\.mp3$"],
}


def hash_id(value: str) -> str:
    return hashlib.sha1(value.encode("utf-8")).hexdigest()[:10]


def scan_files(folders: list[str]) -> list[Path]:
    files: list[Path] = []
    for folder in folders:
        root = Path(folder)
        if not root.exists():
            continue
        for file_path in root.rglob("*"):
            if file_path.is_file() and file_path.suffix.lower() in AUDIO_EXTS:
                files.append(file_path)
    return sorted(files)


def read_tags(path: Path) -> dict[str, str]:
    try:
        tags = File(path, easy=True)
        if not tags:
            return {}
        return {
            "title": "; ".join(tags.get("title", [])),
            "artist": "; ".join(tags.get("artist", [])),
            "genre": "; ".join(tags.get("genre", [])),
            "comment": "; ".join(tags.get("comment", [])),
        }
    except Exception:
        return {}


def detect_subtype(path: Path, tags: dict[str, str]) -> str:
    name = path.name.lower()
    parent = path.parent.name.lower()

    for key in ("genre", "comment"):
        value = tags.get(key, "")
        if value:
            for subtype, patterns in SUBTYPE_PATTERNS.items():
                if any(re.search(pattern, value, re.IGNORECASE) for pattern in patterns):
                    return subtype

    for subtype, patterns in SUBTYPE_PATTERNS.items():
        if any(re.search(pattern, name, re.IGNORECASE) or re.search(pattern, parent, re.IGNORECASE) for pattern in patterns):
            return subtype

    if path.suffix.lower() == ".mp3":
        return "mp3"
    return "unknown"


def normalize_artist_title(path: Path, tags: dict[str, str]) -> tuple[str, str]:
    artist = tags.get("artist", "")
    title = tags.get("title", "")
    if artist and title:
        return artist, title

    stem = re.sub(r"^\d+\s*[-_.]\s*", "", path.stem)
    parts = re.split(r"\s*[-–—]\s*", stem)
    if len(parts) >= 2:
        return parts[0].strip(), " - ".join(parts[1:]).strip()
    return artist, title


def load_index(path: str) -> list[dict]:
    file_path = Path(path)
    if not file_path.exists():
        return []
    return json.loads(file_path.read_text(encoding="utf-8"))


def save_index(path: str, data: list[dict]) -> None:
    Path(path).write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def write_song_number_tag_mp3(path: str, number: str, apply: bool = False) -> bool:
    try:
        try:
            id3 = ID3(path)
        except ID3NoHeaderError:
            id3 = ID3()

        id3.delall("TXXX:SongNumber")
        id3.add(TXXX(encoding=3, desc="SongNumber", text=str(number)))
        if apply:
            id3.save(path)
        return True
    except Exception as err:
        print("Tag write error", path, err)
        return False


def assign_numbers(
    files: list[Path],
    pattern: str,
    start: int,
    increment: int,
    scope: str,
    index_map: dict[str, dict],
    apply: bool = False,
    write_tags: bool = False,
) -> list[tuple[str, str]]:
    results: list[tuple[str, str]] = []

    if scope == "folder":
        groups: dict[str, list[Path]] = defaultdict(list)
        for file_path in files:
            groups[str(file_path.parent)].append(file_path)

        for folder, grouped_files in groups.items():
            seq = start
            for file_path in sorted(grouped_files):
                sid = pattern.format(folder_prefix=Path(folder).name.upper()[:4], seq=seq)
                entry = index_map.get(str(file_path), {})
                entry.update({"path": str(file_path), "song_number": sid})
                index_map[str(file_path)] = entry
                if write_tags and file_path.suffix.lower() == ".mp3":
                    write_song_number_tag_mp3(str(file_path), sid, apply=apply)
                results.append((str(file_path), sid))
                seq += increment
    else:
        seq = start
        for file_path in files:
            sid = pattern.format(folder_prefix=file_path.parent.name.upper()[:4], seq=seq)
            entry = index_map.get(str(file_path), {})
            entry.update({"path": str(file_path), "song_number": sid})
            index_map[str(file_path)] = entry
            if write_tags and file_path.suffix.lower() == ".mp3":
                write_song_number_tag_mp3(str(file_path), sid, apply=apply)
            results.append((str(file_path), sid))
            seq += increment

    return results


def build_index(files: list[Path], existing_index: list[dict]) -> list[dict]:
    index_map = {item["path"]: item for item in existing_index}
    for file_path in files:
        tags = read_tags(file_path)
        subtype = detect_subtype(file_path, tags)
        artist, title = normalize_artist_title(file_path, tags)
        entry = index_map.get(str(file_path), {})
        entry.update(
            {
                "id": entry.get("id", hash_id(str(file_path))),
                "path": str(file_path),
                "title": title or "",
                "artist": artist or "",
                "genre": tags.get("genre", ""),
                "subtype": subtype,
                "filetype": file_path.suffix.lower().lstrip("."),
                "duration": entry.get("duration", 0),
                "song_number": entry.get("song_number", ""),
            }
        )
        index_map[str(file_path)] = entry
    return list(index_map.values())


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--folders", nargs="+", required=True)
    parser.add_argument("--index", default="index.json")
    parser.add_argument("--pattern", default="{folder_prefix}-{seq:04d}")
    parser.add_argument("--start", type=int, default=1)
    parser.add_argument("--increment", type=int, default=1)
    parser.add_argument("--scope", choices=["folder", "global"], default="folder")
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--write-tags", action="store_true")
    args = parser.parse_args()

    files = scan_files(args.folders)
    print(f"Found {len(files)} audio files.")

    existing = load_index(args.index)
    index = build_index(files, existing)
    index_map = {item["path"]: item for item in index}

    results = assign_numbers(
        files,
        args.pattern,
        args.start,
        args.increment,
        args.scope,
        index_map,
        apply=False,
        write_tags=False,
    )
    print("Preview of assigned numbers (first 200):")
    for path, sid in results[:200]:
        print(path, "->", sid)

    assigned = [sid for _, sid in results]
    dupes = {sid for sid in assigned if assigned.count(sid) > 1}
    if dupes:
        print("Collision detected for IDs:", sorted(dupes))
        if not args.apply:
            print("Resolve collisions before applying.")
            return

    if args.apply:
        assign_numbers(
            files,
            args.pattern,
            args.start,
            args.increment,
            args.scope,
            index_map,
            apply=True,
            write_tags=args.write_tags,
        )
        save_index(args.index, list(index_map.values()))
        print("Index saved and tags written (if requested).")
    else:
        print("Dry run complete. Re-run with --apply to persist changes.")


if __name__ == "__main__":
    main()
