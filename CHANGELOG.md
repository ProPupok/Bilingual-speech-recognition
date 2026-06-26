# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/2.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Authentification page before accessing the website in \<ADD PULL REQUEST HERE>
- Three roles of the account: user (can observe content on the page), manager and admin (can upload and delete the audios) in \<ADD PULL REQUEST HERE>
- Ability to delete audio in a track list in \<ADD PULL REQUEST HERE>
- Profile button with options: security and log out in \<ADD PULL REQUEST HERE>
- Security page with ability to check the username and role, change the password, and delete the account in \<ADD PULL REQUEST HERE>
- Bilingual Russian/Tatar recognition pipeline with audio language detection per segment and per-word ru/tt tagging in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/136
- Speaker diarization (who is speaking) with sentence and speaker segmentation in the transcript in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/136
- Search filters by word, language, speaker and date in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/136
- Transcription quality test rig (scripts/transcription_quality_test.py) in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/136

### Changed
- Audio Streams page was renamed to Dashboard page and completely redesigned, including new font sizes and layout in \<ADD PULL REQUEST HERE>
- All interface was localized to Russian instead of English in \<ADD PULL REQUEST HERE>
- Transcription now displays raw text with punctuation and casing in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/136
- Transcription API extended: /transcriptions/{id} returns sentences, /search/ gains speaker and date filters in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/136

## [0.1.0] - 21.06.2026

### Added

- Audio Streams page with list of audios and upload functionality in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/42
- Uploaded audio transcription feature in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/49
- Color coding Russian and Tatar words in transcription in https://github.com/SWP-Team20/Bilingual-speech-recognition/pull/52

[unreleased]: https://github.com/SWP-Team20/Bilingual-speech-recognition/compare/v0.1.0...main
[0.1.0]: https://github.com/SWP-Team20/Bilingual-speech-recognition/releases/tag/v0.1.0
