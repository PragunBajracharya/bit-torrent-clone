"use strict";

import fs from "fs";
import bencode from "bencode";
import { Buffer } from "buffer";
import BigNumber from "bignumber.js";

export const open = (filepath) => {
	return bencode.decode(fs.readFileSync(filepath));
};

export const size = (torrent) => {
	const size = torrent.info.files
		? torrent.info.files.map((file) => file.length).reduce((a, b) => a + b)
		: torrent.info.length;

	const paddedHex = BigNumber(size).toString(16).padStart(16, "0");
	return Buffer.from(paddedHex, "hex");
};

export const infoHash = (torrent) => {
	const info = bencode.encode(torrent.info);
	return crypto.createHash("sha1").update(info).digest();
};
