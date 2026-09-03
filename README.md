# waw2wav
Converts encrypted KONAMI .waw files in medal games such as Marble Fever to playable .wav fun the whole family can enjoy!

## GAME CODES:
    mf/MF - MARBLE FEVER/MARBLE CARNIVAL

If you provide a game code which is non existent, the script will assume you meant to load from a custom (4096 bytes) key.bin file. Do not do this unless you know what you're doing. <br>

## Waw2Wav Usage (waw2wav.js):
```bash
  waw2wav.js <PATH_TO_WAW_FILE> <GAME_CODE>
```

Output files will be the same path as <PATH_TO_WAW_FILE> but with .wav on the end instead.

## Mass Waw 2 Wav Usage (mwaw2wav.js):
```bash
  mwaw2wav.js <PATH_TO_WAW_FILES> <GAME_CODE>
```
Output files will be the same path as the working directory but in a new folder named <PATH_TO_WAW_FILES> but with \"_decrypted\" added on the end instead.

## For those with other medal games
You can easily find the bytes you need for your custom key table bin by searching in the ark dll (or others if you cant find it) for the sequence of bytes "25 F8 0F 00" (& 0xFF8 operation) and clicking on whatever byte_XXXX or unk_XXXX, etc whatever it's using as a lookup table of sorts. <br>
The custom key lookup table would need to be saved in the current directory as filenamehere.bin - then you'd just pass filenamehere.bin as the 2nd argument to waw2wav.js
