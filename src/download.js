"use strict";

import net from "net";

import { getPeers } from "./tracker.js";
import {
	buildHandshake,
	buildInterested,
	parse,
	buildRequest,
} from "./message.js";

import Pieces from "./Pieces.js";
import Queue from "./Queue.js";

export const torrent = (torrent) => {
	getPeers(torrent, (peers) => {
		const pieces = new Pieces(torrent.info.pieces.length / 20);
		peers.forEach((peer) => download(peer, torrent, pieces));
	});
};

function download(peer, torrent, pieces) {
	const socket = new net.Socket();
	socket.on("error", console.log);
	socket.connect(peer.port, peer.ip, () => {
		socket.write(buildHandshake(torrent));
	});
	const queue = new Queue(torrent);
	onWholeMsg(socket, (msg) => msgHandler(socket, msg, pieces, queue));
}

function onWholeMsg(socket, callback) {
	let savedBuf = Buffer.alloc(0);
	let handshake = true;

	socket.on("data", (recvBuf) => {
		const msgLen = () =>
			handshake
				? savedBuf.readUInt8(0) + 49
				: savedBuf.readInt32BE(0) + 4;
		savedBuf = Buffer.concat([savedBuf, recvBuf]);

		while (savedBuf.length >= 4 && savedBuf.length >= msgLen()) {
			callback(savedBuf.slice(0, msgLen()));
			savedBuf = savedBuf.slice(msgLen());
			handshake = false;
		}
	});
}

function msgHandler(socket, msg, pieces, queue) {
	if (isHandshake(msg)) {
		socket.write(buildInterested());
	} else {
		const m = parse(msg);
		if (m.id === 0) chokeHandler(socket);
		if (m.id === 1) unchokeHandler(socket, pieces, queue);
		if (m.id === 4) haveHandler(m.payload, socket, pieces, queue);
		if (m.id === 5) bitfieldHandler(m.payload);
		if (m.id === 7) pieceHandler(m.payload, socket, pieces, queue);
	}
}

function isHandshake(msg) {
	return (
		msg.length === msg.readUInt8(0) + 49 &&
		msg.toString("utf8", 1) === "BitTorrent protocol"
	);
}

function chokeHandler(socket) {
	socket.end();
}

function unchokeHandler(socket, pieces, queue) {
	queue.chocked = false;
	requestPiece(socket, pieces, queue);
}

function haveHandler(payload, socket, pieces, queue) {
	const pieceIndex = payload.readUInt32BE(0);
	queue.push(pieceIndex);
	if (queue.length === 1) {
		requestPiece(socket, pieces, queue);
	}
}

function bitfieldHandler(payload) {}

function pieceHandler(payload, socket, pieces, queue) {
	// ...
	queue.shift();
	requestPiece(socket, pieces, queue);
}

function requestPiece(socket, pieces, queue) {
	if (queue.chocked) return null;
	while (queue.length) {
		const pieceIndex = queue.dequeue();
		if (pieces.needed(pieceIndex)) {
			socket.write(buildRequest(pieceIndex));
			pieces.addRequested(pieceIndex);
			break;
		}
	}
}
