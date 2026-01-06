import * as THREE from 'three';

/**
 * Converts a LUT image into a Data3DTexture.
 * Supports:
 * - Square HaldCLUT (e.g., 512x512 -> Size 64)
 * - Horizontal Strip (e.g., 256x16 -> Size 16)
 * - Vertical Strip (e.g., 16x256 -> Size 16)
 */
export const convertImageTo3DLUT = (image) => {
    const width = image.width;
    const height = image.height;
    let size = 0;
    let layout = 'square'; // 'square', 'h-strip', 'v-strip'

    // Detect layout and size
    if (width === height) {
        // Square: Size = Width^(2/3)
        // Example: 512x512 -> 512^(2/3) = 64
        const approxSize = Math.cbrt(width * width); // or width^(2/3)
        size = Math.round(Math.pow(width, 2 / 3));

        // Validation check
        // For size 64: 64^3 = 262144. 512^2 = 262144. Correct.
        if (Math.abs(Math.pow(size, 3) - width * height) > 1) {
            console.warn(`LUT Image ${width}x${height} logic mismatch. Size found: ${size}`);
        }
        layout = 'square';
    } else if (width > height) {
        // Horizontal Strip? Usually W = Size*Size, H = Size
        if (width === height * height) {
            size = height;
            layout = 'h-strip';
        } else {
            // Maybe W = Size*Size*Size (1D strip)?
            // Assume W = Size*Size is most common for strips.
            // If not, try to just derive size size from Volume
            // Vol = W * H = Size^3
            size = Math.round(Math.cbrt(width * height));
            // If H == Size, then it's H-Strip
            if (height === size) layout = 'h-strip';
        }
    } else {
        // Vertical Strip
        if (height === width * width) {
            size = width;
            layout = 'v-strip';
        } else {
            size = Math.round(Math.cbrt(width * height));
            if (width === size) layout = 'v-strip';
        }
    }

    if (size === 0) {
        console.error("Unknown LUT format.");
        return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(image, 0, 0);
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    const buffer = new Uint8Array(size * size * size * 4);

    // Grid dimensions for Square layout
    // Example: Size 64. Grid 8x8.
    // cols = sqrt(size) -> 512x512 has 64^3. Slices=64. Grid is 8x8.
    // 8 = sqrt(64). Correct.
    const gridCols = Math.round(Math.sqrt(size));

    for (let z = 0; z < size; z++) {
        let blockX, blockY;

        if (layout === 'square') {
            blockX = z % gridCols;
            blockY = Math.floor(z / gridCols);
        } else if (layout === 'h-strip') {
            blockX = z;
            blockY = 0;
        } else if (layout === 'v-strip') {
            blockX = 0;
            blockY = z;
        }

        // Pixel offset in the source image
        const xOff = blockX * size;
        const yOff = blockY * size;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                // Source index
                const srcX = xOff + x;
                const srcY = yOff + y;

                // Safety check
                if (srcX >= width || srcY >= height) continue;

                const srcIndex = (srcY * width + srcX) * 4;

                // Dest index (z, y, x) -> Standard 3D Texture packing
                const dstIndex = (z * size * size + y * size + x) * 4;

                buffer[dstIndex] = data[srcIndex];     // R
                buffer[dstIndex + 1] = data[srcIndex + 1]; // G
                buffer[dstIndex + 2] = data[srcIndex + 2]; // B
                buffer[dstIndex + 3] = 255;
            }
        }
    }

    const texture = new THREE.Data3DTexture(buffer, size, size, size);
    texture.format = THREE.RGBAFormat;
    texture.type = THREE.UnsignedByteType;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.unpackAlignment = 1;
    texture.needsUpdate = true;
    return texture;
};
