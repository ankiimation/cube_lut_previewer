import React, { useRef } from 'react';
import './LutPanel.css';

const LutPanel = ({ lutFiles, setLutFiles, selectedLut, setSelectedLut }) => {
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        if (!e.target.files) return;
        const files = Array.from(e.target.files);
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
    };

    return (
        <div className="lut-panel-container">
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
                        No LUTs loaded.
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
        </div>
    );
};

export default LutPanel;
