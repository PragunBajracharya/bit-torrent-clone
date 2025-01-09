"use strict";

import net from "net";

import { getPeers } from "./tracker.js";

export const torrent = () => {
	getPeers(torrent, (peers) => {
		peers.forEach(download);
	});
};

function download(peer) {
	const socket = new net.Socket();
	socket.on("error", console.log);
	socket.connect(peer.port, peer.ip, () => {
		// socket.write(message);
	});

	socket.on("data", (data) => {});
}
