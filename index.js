"use strict";

import fs from "fs";
import bencode from "bencode";
import dgram from "dgram";
import { Buffer } from "buffer";

import { getPeers } from "./tracker.js";

const torrent = bencode.decode(fs.readFileSync("puppy.torrent"));

getPeers(torrent, (peers) => {
    console.log("list of peers", peers);
});

const socket = dgram.createSocket("udp4");

const myMsg = Buffer.from("hello?", "utf8");

socket.send(myMsg, 0, myMsg.length, url.port, url.host, () => {});

socket.on("message", (response) => {
	console.log("message", response);
});
