import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { Auth } from './Auth.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Auth>
      <App />
    </Auth>
  </StrictMode>,
);
