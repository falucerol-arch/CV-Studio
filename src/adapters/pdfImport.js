import { GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url';

// Vite rewrites this asset URL using the configured base path, including GitHub Pages.
GlobalWorkerOptions.workerSrc = workerUrl;

export { importPdfResume, loadPdfReference, openPdfDocument, renderPdfPage, savePdfReference } from './pdfImportCore.js';
