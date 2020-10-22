import'bootstrap/dist/css/bootstrap.min.css';
import'bootstrap/dist/js/bootstrap.bundle.min';
import './index.css';
import './components/alert/Alert.css'

import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';
import './tinymce'

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);