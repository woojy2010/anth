# 배경음 / Background music

이 폴더에 **`bgm.mp3`** 라는 이름으로 파일을 하나 넣으면 게임이 시작될 때
자동으로 재생되고 계속 반복됩니다.

Drop a single file named **`bgm.mp3`** in this folder. It starts when you press
START and loops for the whole session.

```
audio/bgm.mp3
```

파일이 없거나 `file://` 로 열어서 못 읽는 경우, 화면 아래 **음악** 버튼으로
직접 골라도 됩니다 (서버 없이 동작합니다).

If the file is missing — or the browser blocks it under `file://` — use the
**Music** button at the bottom to pick a file from disk instead. That path works
without a server.

브라우저 정책상 소리는 사용자 동작 뒤에만 시작됩니다. 그래서 시작 버튼을
누르는 순간에 재생을 겁니다.

Browsers only allow audio after a user gesture, so playback begins on START.
