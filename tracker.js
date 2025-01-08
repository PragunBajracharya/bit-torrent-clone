'use strict';

import dgram from "dgram";
import { Buffer } from "buffer";
import parse from "url-parse";
import crypto from "crypto";


export const getPeers = (torrent, callback) => {
	const socket = dgram.createSocket("udp4");
	const url = parse(torrent.announce.toString("utf8"));

	udpSend(socket, buildConnReq(), url);

	socket.on("message", (response) => {
		if (respType(response) === "connect") {
			const connResp = parseConnResp(response);
			const announceReq = buildAnnounceReq(connResp.connectionId);
			udpSend(socket, announceReq, url);
		} else if (respType(response) === "announce") {
			const announceResp = parseAnnounceResp(response);
			callback(announceResp.peers);
		}
	});
};

function udpSend(socket, message, rawUrl, callback = () => {}) {
	const url = parse(rawUrl);
	socket.send(message, 0, message.length, url.port, url.host, callback);
}

function respType(resp) {

}


function buildConnReq() {  
    const buf = Buffer.alloc(16);

    buf.writeUInt32BE(0x417, 0);
    buf.writeUInt32BE(0x27101980, 4);

    buf.writeUInt32BE(0, 8);

    crypto.randomBytes(4).copy(buf, 12);

    return buf;
}


function parseConnResp(resp) {

}


function buildAnnounceReq(connId) {

}


function parseAnnounceResp(resp) {

}