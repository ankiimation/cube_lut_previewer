import React, { useCallback, useRef } from 'react';
import useFileDrop from '../hooks/useFileDrop';
import './LutPanel.css';

const LUT_EXTENSIONS = ['.cube', '.png', '.jpg', '.jpeg'];

const isLutFile = (file) =>
    LUT_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext));

const LutPanel = ({ lutFiles, setLutFiles, selectedLut, setSelectedLut }) => {
    const fileInputRef = useRef(null);

    const addLuts = useCallback((files) => {
        const newLuts = files.map(file => ({
            name: file.name,
            url: URL.createObjectURL(file), // For preview or processing
            type: file.name.toLowerCase().endsWith('.cube') ? 'cube' : 'png',
            file: file
        }));

        setLutFiles(prev => [...prev, ...newLuts]);

        if (newLuts.length > 0) {
            setSelectedLut(newLuts[0]);
        }
    }, [setLutFiles, setSelectedLut]);

    const handleFileChange = (e) => {
        if (!e.target.files) return;
        addLuts(Array.from(e.target.files));
        e.target.value = ''; // allow re-picking the same file
    };

    const { isDragOver, dropProps } = useFileDrop(addLuts, isLutFile);

    return (
        <div
            className={`lut-panel-container ${isDragOver ? 'drag-over' : ''}`}
            {...dropProps}
        >
            <div className="upload-section">
                <h3 className="section-title">Library</h3>
                <button className="upload-btn" onClick={() => fileInputRef.current?.click()}>
                    + Add LUTs (.cube / .png)
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept=".cube,.png,.jpg,.jpeg"
                    multiple
                    onChange={handleFileChange}
                />
            </div>

            <div className="lut-list">
                {lutFiles.length === 0 && (
                    <div className="empty-state">
                        No LUTs loaded.<br />
                        Drop .cube / .png files here.
                    </div>
                )}
                {lutFiles.map((lut, index) => (
                    <div
                        key={index}
                        className={`lut-item ${selectedLut === lut ? 'selected' : ''}`}
                        onClick={() => setSelectedLut(lut)}
                    >
                        {lut.name}
                    </div>
                ))}
            </div>

            {isDragOver && (
                <div className="drop-overlay">
                    <span>Drop LUTs to add</span>
                </div>
            )}
        </div>
    );
};

export default LutPanel;
