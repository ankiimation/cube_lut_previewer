import { useCallback, useRef, useState } from 'react';

/**
 * Drag & drop file handling for a drop zone.
 *
 * @param {(files: File[]) => void} onFiles called with the accepted files
 * @param {(file: File) => boolean} [accept] filter, defaults to accepting everything
 * @returns {{ isDragOver: boolean, dropProps: object }} spread dropProps onto the zone element
 */
const useFileDrop = (onFiles, accept) => {
    const [isDragOver, setIsDragOver] = useState(false);
    // dragenter/dragleave fire for every child element, so count depth instead of toggling
    const depth = useRef(0);

    const hasFiles = (e) =>
        Array.from(e.dataTransfer?.types || []).includes('Files');

    const handleDragEnter = useCallback((e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        e.stopPropagation();
        depth.current += 1;
        setIsDragOver(true);
    }, []);

    const handleDragOver = useCallback((e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
    }, []);

    const handleDragLeave = useCallback((e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        e.stopPropagation();
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        e.stopPropagation();
        depth.current = 0;
        setIsDragOver(false);

        const files = Array.from(e.dataTransfer.files || []);
        const accepted = accept ? files.filter(accept) : files;
        if (accepted.length > 0) onFiles(accepted);
    }, [onFiles, accept]);

    return {
        isDragOver,
        dropProps: {
            onDragEnter: handleDragEnter,
            onDragOver: handleDragOver,
            onDragLeave: handleDragLeave,
            onDrop: handleDrop
        }
    };
};

export default useFileDrop;
