'use strict';

import * as tp from "./torrent-parser.js";

class Queue {
    constructor(torrent) {
        this._torrent = torrent;
        this._queue = [];
        this.choked = true;
    }

    queue(pieceIndex) {
        const nBlocks = tp.blocksPerPiece(this._torrent, pieceIndex);
        for (let i = 0; i < nBlocks; i++) {
            const pieceBlock = {
                index: pieceIndex,
                begin: i * tp.BLOCK_LEN,
                length: tp.blockLen(this._torrent, pieceIndex, i)
            };
            this._queue.push(pieceBlock);
        }
    }

    dequeue() {
        return this._queue.shift();
    }

    peek (){
        return this._queue[0];
    }

    length() {
        return this._queue.length;
    }
}

export default Queue;