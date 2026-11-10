import { doppelt } from './rechner.mjs';
const ausgabe = document.querySelector('#ausgabe');
if (ausgabe) ausgabe.textContent = 'Doppelt von 5 ist ' + doppelt(5);
