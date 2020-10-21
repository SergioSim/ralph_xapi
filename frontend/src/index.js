import'bootstrap/dist/css/bootstrap.min.css';
import'bootstrap/dist/js/bootstrap.bundle.min';
import feather from 'feather-icons/dist/feather';

import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';
import './index.css';
import './components/alert/Alert.css'
import './tinymce'

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);