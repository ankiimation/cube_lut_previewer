import React, { useEffect, useRef, useMemo, useState } from 'react';
import { useThree, extend, useFrame } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { LUTCubeLoader } from 'three/examples/jsm/loaders/LUTCubeLoader';
import { convertImageTo3DLUT } from '../utils/lutHelper';

// Define the shader material
const LutShaderMaterial = shaderMaterial(
    {
        uTexture: new THREE.Texture(),
        uLut: new THREE.Data3DTexture(new Uint8Array(4), 1, 1, 1),
        uIntensity: 1.0,
        uSliderPos: 0.5,
        uLutSize: 64.0,
        uHasLut: false,
    },
    // Vertex Shader
    `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    // Fragment Shader
    `
    precision highp float;
    precision highp sampler3D;

    varying vec2 vUv;
    uniform sampler2D uTexture;
    uniform sampler3D uLut;
    uniform float uIntensity;
    uniform float uSliderPos;
    uniform float uLutSize;
    uniform bool uHasLut;
    
    vec3 applyLut(vec3 color) {
        float scale = (uLutSize - 1.0) / uLutSize;
        float offset = 1.0 / (2.0 * uLutSize);
        vec3 uvw = color * scale + offset;
        return texture(uLut, uvw).rgb;
    }

    void main() {
      vec4 originalColor = texture(uTexture, vUv);
      vec3 finalColor = originalColor.rgb;
      
      if (uHasLut) {
        vec3 lutted = applyLut(originalColor.rgb);
        finalColor = mix(originalColor.rgb, lutted, uIntensity);
      }

      // Slider separator line
      float dist = abs(vUv.x - uSliderPos);
      if (dist < 0.002) {
         gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
         return;
      }

      if (vUv.x > uSliderPos) {
        // Right side: After
        gl_FragColor = vec4(finalColor, originalColor.a);
      } else {
        // Left side: Before
        gl_FragColor = originalColor;
      }
    }
  `
);

extend({ LutShaderMaterial });

const LutScene = ({ media, lut, intensity, sliderPos }) => {
    const { viewport } = useThree();
    const materialRef = useRef();
    const [texture, setTexture] = useState(null);
    const [lutTexture, setLutTexture] = useState(null);
    const [aspect, setAspect] = useState(1);

    // Manage Media Loading
    useEffect(() => {
        let active = true;
        if (media.type === 'video') {
            const vid = document.createElement('video');
            vid.src = media.url;
            vid.crossOrigin = 'Anonymous';
            vid.loop = true;
            vid.muted = true;
            vid.playsInline = true;

            const handleResize = () => {
                if (vid.videoWidth && vid.videoHeight) {
                    setAspect(vid.videoWidth / vid.videoHeight);
                }
            };
            vid.addEventListener('loadedmetadata', handleResize);

            vid.play().catch(e => console.error("Video play error", e));

            const vidTex = new THREE.VideoTexture(vid);
            vidTex.minFilter = THREE.LinearFilter;
            vidTex.magFilter = THREE.LinearFilter;
            vidTex.format = THREE.RGBAFormat;

            if (active) {
                setTexture(vidTex);
            }

            return () => {
                active = false;
                vid.removeEventListener('loadedmetadata', handleResize);
                vid.pause();
                vid.src = '';
                vidTex.dispose();
            }
        } else if (media.type === 'image') {
            const loader = new THREE.TextureLoader();
            loader.load(media.url, (tex) => {
                if (active) {
                    tex.encoding = THREE.SRGBColorSpace;
                    if (tex.image) {
                        setAspect(tex.image.width / tex.image.height);
                    }
                    setTexture(tex);
                }
            });
            return () => active = false;
        } else {
            setTexture(null);
        }
    }, [media]);

    // Manage LUT Loading
    useEffect(() => {
        if (!lut) {
            setLutTexture(null);
            return;
        }

        let active = true;
        if (lut.type === 'cube') {
            const loader = new LUTCubeLoader();
            loader.load(lut.url, (result) => {
                if (active) setLutTexture(result.texture3D);
            }, undefined, (err) => console.error("Error loading cube", err));
        } else if (lut.type === 'png') {
            const loader = new THREE.ImageLoader();
            loader.load(lut.url, (image) => {
                if (active) {
                    const tex3D = convertImageTo3DLUT(image);
                    setLutTexture(tex3D);
                }
            });
        }
        return () => active = false;
    }, [lut]);

    // Calculate Scale
    const scale = useMemo(() => {
        // If no media, return 0 to hide or 1
        if (!texture) return [1, 1, 1];

        // Fit logic
        const viewAspect = viewport.width / viewport.height;

        let w, h;
        if (aspect > viewAspect) {
            // Image is wider than viewport -> Fit Width
            w = viewport.width;
            h = w / aspect;
        } else {
            // Image is taller -> Fit Height
            h = viewport.height;
            w = h * aspect;
        }
        return [w, h, 1];
    }, [aspect, viewport.width, viewport.height, texture]);

    return (
        <mesh scale={scale}>
            <planeGeometry args={[1, 1]} />
            {/* Pass uniforms as props */}
            <lutShaderMaterial
                ref={materialRef}
                transparent
                toneMapped={false}
                uTexture={texture || new THREE.Texture()}
                uLut={lutTexture || new THREE.Data3DTexture(new Uint8Array(4), 1, 1, 1)}
                uHasLut={!!lutTexture}
                uLutSize={lutTexture ? lutTexture.image.width : 64.0}
                uIntensity={intensity}
                uSliderPos={sliderPos}
            />
        </mesh>
    );
};
export default LutScene;
