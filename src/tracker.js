"use strict";

import dgram from "dgram";
import { Buffer } from "buffer";
import parse from "url-parse";
import crypto from "crypto";

import * as util from "./util.js";

export const getPeers = (torrent, callback) => {
	const socket = dgram.createSocket("udp4");
	const url = parse(Array.from(torrent.announce).map(charCode => String.fromCharCode(charCode)).join(''));
	
	// send connection request
	udpSend(socket, buildConnReq(), url);

	socket.on("message", (response) => {
		if (respType(response) === "connect") {
			// receive and parse connection response
			const connResp = parseConnResp(response);

			// send announce request
			const announceReq = buildAnnounceReq(
				connResp.connectionId,
				torrent
			);
			udpSend(socket, announceReq, url);
		} else if (respType(response) === "announce") {
			// parse announce response
			const announceResp = parseAnnounceResp(response);
			// pass peers to callback
			callback(announceResp.peers);
		}
	});
};

function udpSend(socket, message, rawUrl, callback = () => {}) {
	const url = parse(rawUrl);
	socket.send(message, 0, message.length, url.port, url.host, callback);
}

function respType(resp) {
    const action = resp.readUInt32BE(0);
    if (action === 0) return "connect";
    if (action === 1) return "announce";
}

function buildConnReq() {
	const buf = Buffer.alloc(16);

	// connection id
	buf.writeUInt32BE(0x417, 0);
	buf.writeUInt32BE(0x27101980, 4);

	// action
	buf.writeUInt32BE(0, 8);

	// transaction id
	crypto.randomBytes(4).copy(buf, 12);

	return buf;
}

function parseConnResp(resp) {
	return {
		action: resp.readUInt32BE(0),
		transactionId: resp.readUInt32BE(4),
		connectionId: resp.slice(8),
	};
}

function buildAnnounceReq(connId, torrent, port = 6881) {
	const buf = Buffer.allocUnsafe(98);

	// connection id
	connId.copy(buf, 0);

	// action
	buf.writeUInt32BE(1, 8);

	// transaction id
	crypto.randomBytes(4).copy(buf, 12);

	// info hash
	torrentParser.infoHash(torrent).copy(buf, 16);

	// peerId
	util.genId().copy(buf, 36);

	// downloaded
	Buffer.alloc(8).copy(buf, 56);

	// left
	torrentParser.size(torrent).copy(buf, 64);

	// uploaded
	Buffer.alloc(8).copy(buf, 72);

	// event
	buf.writeUInt32BE(0, 80);

	// ip address
	buf.writeUInt32BE(0, 84);

	// key
	crypto.randomBytes(4).copy(buf, 88);

	// num want
	buf.writeInt32BE(-1, 92);

	// port
	buf.writeUInt16BE(port, 96);

	return buf;
}

function parseAnnounceResp(resp) {
	return {
		action: resp.readUInt32BE(0),
		transactionId: resp.readUInt32BE(4),
		leechers: resp.readUInt32BE(8),
		seeders: resp.readUInt32BE(12),
		peers: group(resp.slice(20), 6).map((address) => {
			return {
				ip: address.slice(0, 4).join("."),
				port: address.readUInt16BE(4),
			};
		}),
	};
}

function group(iterable, groupSize) {
	let groups = [];
	for (let i = 0; i < iterable.length; i += groupSize) {
		groups.push(iterable.slice(i, i + groupSize));
	}
	return groups;
}
