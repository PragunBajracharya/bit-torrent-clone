"use strict";

import net from "net";

import { getPeers } from "./tracker.js";
import { buildHandshake, buildInterested, parse } from "./message.js";

export const torrent = () => {
	getPeers(torrent, (peers) => {
		peers.forEach(download);
	});
};

function download(peer, torrent) {
	const socket = new net.Socket();
	socket.on("error", console.log);
	socket.connect(peer.port, peer.ip, () => {
		socket.write(buildHandshake(torrent));
	});
	onWholeMsg(socket, (data) => {});
}


function onWholeMsg(socket, callback) {
	let savedBuf = Buffer.alloc(0);
	let handshake = true;

	socket.on("data", (recvBuf) => {
		const msgLen = () => handshake ? savedBuf.readUInt8(0) + 49 : savedBuf.readInt32BE(0) + 4;
		savedBuf = Buffer.concat([savedBuf, recvBuf]);

		while (savedBuf.length >= 4 && savedBuf.length >= msgLen()) {
			callback(savedBuf.slice(0, msgLen()));
			savedBuf = savedBuf.slice(msgLen());
			handshake = false;
		}
	});
}

function msgHandler(socket, msg) {
	if (isHandshake(msg)) {
		socket.write(buildInterested());
	} else {
		const m = parse(msg);
		if (m.id === 0) chokeHandler();
		if (m.id === 1) unchokeHandler();
		if (m.id === 4) haveHandler(m.payload);
		if (m.id === 5) bitfieldHandler(m.payload);
		if (m.id === 7) pieceHandler(m.payload);
	}
}

function isHandshake(msg) {
	return msg.length === msg.readUInt8(0) + 49 && msg.toString("utf8", 1) === "BitTorrent protocol";
}

function chokeHandler() {}

function unchokeHandler() {}

function haveHandler(payload) {}

function bitfieldHandler(payload) {}

function pieceHandler(payload) {}