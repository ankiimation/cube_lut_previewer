import React, { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import LutScene from './LutScene';
import './PreviewPanel.css';

const PreviewPanel = ({ selectedLut, media, setMedia, intensity, setIntensity }) => {
    const [sliderPos, setSliderPos] = useState(0.5);
    const containerRef = useRef(null);
    const isDragging = useRef(false);
    const fileInputRef = useRef(null);

    const handleMouseDown = (e) => {
        isDragging.current = true;
        e.preventDefault();
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e) => {
        if (!isDragging.current || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        setSliderPos(x / rect.width);
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        const type = file.type.startsWith('video') ? 'video' : 'image';
        setMedia({ url, type, name: file.name });
    };

    return (
        <div className="preview-panel-container">
            <div className="toolbar">
                <button className="media-btn" onClick={() => fileInputRef.current?.click()}>
                    Open Media
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,video/*"
                    style={{ display: 'none' }}
                />

                <div className="slider-control">
                    <label>Intensity</label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={intensity}
                        onChange={(e) => setIntensity(parseFloat(e.target.value))}
                    />
                    <span>{Math.round(intensity * 100)}%</span>
                </div>
            </div>

            <div className="canvas-container" ref={containerRef}>
                {!media ? (
                    <div className="placeholder-text">
                        <p>No media loaded</p>
                        <p>Select an image or video to start</p>
                    </div>
                ) : (
                    <>
                        <Canvas
                            linear
                            flat
                            gl={{
                                preserveDrawingBuffer: true,
                                antialias: true
                            }}
                            style={{ width: '100%', height: '100%' }}
                        >
                            <LutScene
                                media={media}
                                lut={selectedLut}
                                intensity={intensity}
                                sliderPos={sliderPos}
                            />
                        </Canvas>

                        <div
                            className="slider-handle-container"
                            style={{ left: `${sliderPos * 100}%` }}
                            onMouseDown={handleMouseDown}
                        >
                            <div className="slider-handle-knob"></div>
                        </div>

                        <div className="label-overlay label-before" style={{ opacity: sliderPos > 0.1 ? 1 : 0 }}>Before</div>
                        <div className="label-overlay label-after" style={{ opacity: sliderPos < 0.9 ? 1 : 0 }}>After</div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PreviewPanel;
