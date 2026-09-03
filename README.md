# waw2wav
Converts encrypted KONAMI .waw files in medal games such as Marble Fever to playable .wav fun the whole family can enjoy!

## For those with other medal games
You can easily find the bytes you need for your custom key table bin by searching in the ark dll (or others if you cant find it) for the sequence of bytes "25 F8 0F 00" (& 0xFF8 operation) and clicking on whatever byte_XXXX or unk_XXXX, etc whatever it's using as a lookup table of sorts. <br>
The custom key lookup table would need to be saved in the current directory as filenamehere.bin - then you'd just pass filenamehere.bin as the 2nd argument to waw2wav.js
