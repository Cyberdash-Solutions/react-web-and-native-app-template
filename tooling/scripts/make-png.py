# Writes a solid-color placeholder PNG (no dependencies). Replace with real brand assets.
import struct, sys, zlib
path, size, hex_color = sys.argv[1], int(sys.argv[2]), sys.argv[3].lstrip('#')
r, g, b = (int(hex_color[i:i + 2], 16) for i in (0, 2, 4))
row = b'\x00' + bytes([r, g, b]) * size
raw = zlib.compress(row * size, 9)
def chunk(tag, data):
    return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)
png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)) + chunk(b'IDAT', raw) + chunk(b'IEND', b'')
open(path, 'wb').write(png)
