import'bootstrap/dist/css/bootstrap.min.css';
import $ from'jquery';
import Popper from 'popper.js';
import'bootstrap/dist/js/bootstrap.bundle.min';
import feather from 'feather-icons/dist/feather';

import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';
import './index.css';
import './tinymce'

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

feather.replace();