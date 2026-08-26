import { useEffect, useState } from 'react';
import './App.css';
import LutPanel from './components/LutPanel';
import PreviewPanel from './components/PreviewPanel';

function App() {
  const [lutFiles, setLutFiles] = useState([]);
  const [selectedLut, setSelectedLut] = useState(null);
  const [media, setMedia] = useState(null); // { url, type, name }
  const [intensity, setIntensity] = useState(1.0);

  // Files dropped outside a drop zone would otherwise navigate the tab to the file
  useEffect(() => {
    const swallow = (e) => e.preventDefault();
    window.addEventListener('dragover', swallow);
    window.addEventListener('drop', swallow);
    return () => {
      window.removeEventListener('dragover', swallow);
      window.removeEventListener('drop', swallow);
    };
  }, []);

  return (
    <div className="app-container">
      <div className="sidebar">
        <h2 className="app-title">Cube LUT Previewer</h2>
        <LutPanel
          lutFiles={lutFiles}
          setLutFiles={setLutFiles}
          selectedLut={selectedLut}
          setSelectedLut={setSelectedLut}
        />
      </div>
      <div className="main-content">
        <PreviewPanel
          selectedLut={selectedLut}
          media={media}
          setMedia={setMedia}
          intensity={intensity}
          setIntensity={setIntensity}
        />
      </div>
    </div>
  );
}

export default App;
