const fs = require('fs');
const path = require('path');

function decryptDatxChunk(encryptedBuffer, fileOffset, lookupTable) {
  if (lookupTable.length !== 4096) {
    throw new Error(`Expected a 4096-byte key table, got ${lookupTable.length} bytes. Are you even doing this right?`);
  }

  let decrypted = Buffer.alloc(encryptedBuffer.length);
  let currentOffset = fileOffset;

  /*
 Size_1 = Size;
    do
    {
      v5 = *a1;
      result = a3 & 0xFF8;
      ++a1;
      v7 = a3 + (a3 >> 12);
      ++a3;
      --Size_1;
      byte_1805BB9F4 = v5 ^ byte_180513E70[(unsigned int)result + (v7 & 7)];
    }
    while ( Size_1 );
  */

  for (let i = 0; i < encryptedBuffer.length; i++) {
    let offset1 = currentOffset & 0xFF8;
    let offset2 = (currentOffset + (currentOffset >> 12)) & 0x07;
    let keyIndex = offset1 + offset2; 
    let keyByte = lookupTable[keyIndex];

    decrypted[i] = encryptedBuffer[i] ^ keyByte;
    currentOffset++;
  }

  return decrypted;
}

function processWavFiles(inputDir, outputDir, lookupTable) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  let lookupTableBytes = fs.readFileSync(lookupTable);

  for(var inputFileName of fs.readdirSync(inputDir)) {
      if (!inputFileName.endsWith(".waw")) {
        continue;
      }

      let inputFile = inputDir + "\\" + inputFileName;
      let fileBuffer = fs.readFileSync(inputFile);

      if (fileBuffer.length < 12) {
        throw new Error('This file likely has no RIFF header. Try another.');
      }

      let riffMagic = fileBuffer.toString('ascii', 0, 4);
      let waveMagic = fileBuffer.toString('ascii', 8, 12);

      //magic riff bytes not found or WAVE - wtf?
      if (riffMagic !== 'RIFF' || waveMagic !== 'WAVE') {
        throw new Error('Invalid WAVE file header.');
      }

      let offset = 12;
      let datxOffset = -1;
      let datxSize = 0;

      while (offset + 8 <= fileBuffer.length) {
        let chunkTag = fileBuffer.toString('ascii', offset, offset + 4);
        let chunkSize = fileBuffer.readUInt32LE(offset + 4);

        if (chunkTag === 'datx') {
          datxOffset = offset;
          datxSize = chunkSize;
          break;
        }

        /* //sub_180189970
        switch ( v11 )
            {
              case 544501094:
                (*(void (__fastcall **)(__int64, _QWORD))(*(_QWORD *)a1 + 176LL))(a1, v5);
                break;
              case 2020893028: -- datx bytes
                *(_DWORD *)(a1 + 92) = XCgsqzn000004f(v5, 0LL, 1LL);
                *(_DWORD *)(a1 + 96) = v12;
                (*(void (**)(__int64, const char *, ...))(*(_QWORD *)qword_1805B46B0 + 16LL))(
                  qword_1805B46B0,
                  "Data chunk: %u\n");
                *(_BYTE *)(a1 + 160) = 1;
                break;
              case 1635017060:
                *(_DWORD *)(a1 + 92) = XCgsqzn000004f(v5, 0LL, 1LL);
                *(_DWORD *)(a1 + 96) = v12;
                (*(void (**)(__int64, const char *, ...))(*(_QWORD *)qword_1805B46B0 + 16LL))(
                  qword_1805B46B0,
                  "Data chunk: %u\n");
                *(_BYTE *)(a1 + 160) = 0;
                break;
              case 1819307379:
                (*(void (__fastcall **)(__int64, _QWORD))(*(_QWORD *)a1 + 184LL))(a1, v5);
                break;
              case 1834120275:
                v2 = (*(__int64 (__fastcall **)(__int64, _QWORD))(*(_QWORD *)a1 + 192LL))(a1, v5);
                break;
                */

        offset += 8 + chunkSize + (chunkSize % 2);
      }

      if (datxOffset === -1) {
        throw new Error('There is no "datx" chunk in this file. Are you sure its a valid .waw file?');
      }

      let outputBuffer = Buffer.from(fileBuffer);

      outputBuffer.write('data', datxOffset, 4, 'ascii'); //to make it a normal wav file, rename datx to data lol

      let payloadStartOffset = datxOffset + 8;
      let encryptedPayload = outputBuffer.subarray(payloadStartOffset, payloadStartOffset + datxSize);
      let decryptedPayload = decryptDatxChunk(encryptedPayload, payloadStartOffset, lookupTableBytes);

      decryptedPayload.copy(outputBuffer, payloadStartOffset);

      fs.writeFileSync(outputDir + "\\" + inputFileName.split('.')[0] + ".wav", outputBuffer);

      console.log(`Converted ${inputFileName} -> ${inputFileName.split('.')[0]}.wav (in ${outputDir})`);
  }

  console.log("Done!");
}

const args = process.argv.slice(2); 
const GAME_CODES = [
    "mf",
    "MF"
];

if (args.length < 2) {
  console.log("---- M(ASS) WAW2WAV USAGE -----");
  console.log("mwaw2wav.js <PATH_TO_WAW_FILES> <GAME_CODE>");
  console.log("GAME CODES:");
  console.log("mf/MF - MARBLE FEVER/MARBLE CARNIVAL");
  console.log("If you provide a game code which is non existent, the script will assume you meant to load from a custom (4096 bytes) key.bin file. Do not do this unless you know what you're doing.")
  console.log("------------------------");
  console.log("Output files will be the same path as the working directory but in a new folder named <PATH_TO_WAW_FILES> but with \"_decrypted\" added on the end instead.");
  return;
}

const dirPathWaw = args[0];
const gameCode = args[1];

let keyBinPath = '';

if (!GAME_CODES.includes(gameCode)) {
    keyBinPath = gameCode;
} else {
    keyBinPath = `keytable-${gameCode.toLowerCase()}.bin`
}

processWavFiles(dirPathWaw, path.basename(dirPathWaw) + "_decrypted", keyBinPath);

//For anyone reading this with other medal games, you can easily find the bytes you need for your custom key table bin by searching for the sequence of bytes "25 F8 0F 00" (& 0xFF8 operation) and clicking on whatever byte_XXXX or unk_XXXX, etc whatever it's using as a lookup table of sorts.