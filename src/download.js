'use strict';

import net from 'net';
import { Buffer } from 'buffer';

const socket = new net.Socket();
socket.on('error', console.log);
socket.connect(port, ip, () => {
    // socket.write(message);
    socket.write(Buffer.from('hello', 'utf8'));
});

socket.on('data', (responseBuffer) => {

}