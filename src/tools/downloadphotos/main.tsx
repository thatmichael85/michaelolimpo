import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './base.css';
import './downloadphotos.css';
import { DownloadPhotos } from './components/DownloadPhotos';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DownloadPhotos />
  </StrictMode>,
);
