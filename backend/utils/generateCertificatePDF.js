// LMS/backend/utils/generateCertificatePDF.js (TEMPORARY TEST VERSION - resource_type changed)

import puppeteer from 'puppeteer';
// import ejs from 'ejs'; // TEMPORARILY COMMENT OUT EJS
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { v2 as cloudinary } from 'cloudinary';
import config from '../config/config.js';

// Cloudinary configuration
cloudinary.config({
  cloud_name: config.cloudinaryCloudName,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinaryApiSecret,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const generateCertificatePDF = async (certificateData) => {
  let browser;
  try {
    // --- TEMPORARY TEST HTML CONTENT ---
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Test PDF</title>
        <style>
          body { font-family: sans-serif; text-align: center; margin-top: 50px; }
          h1 { color: #007bff; }
          p { color: #343a40; }
        </style>
      </head>
      <body>
        <h1>Hello from Puppeteer!</h1>
        <p>This is a test PDF generated from EduFlex.</p>
        <p>Student: ${certificateData.studentName}</p>
        <p>Course: ${certificateData.courseTitle}</p>
        <p>ID: ${certificateData.certificateId}</p>
      </body>
      </html>
    `;
    // --- END TEMPORARY TEST HTML CONTENT ---

    console.log('--- TEST MODE: Using minimal HTML, resource_type: "image" ---');
    console.log('Certificate Data passed to EJS (test):', certificateData);
    console.log('Generated HTML (first 500 chars, test):', html.substring(0, 500));


    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.error('PAGE ERROR:', err.toString()));

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }
    });

    console.log('PDF Buffer size (test):', pdfBuffer.length, 'bytes');

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'lms-certificates-test',
          resource_type: 'raw', // FIXED: Use 'raw' for PDF files
          public_id: `test_certificate_${certificateData.certificateId}`,
          format: 'pdf', // Keep format as pdf
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      ).end(pdfBuffer);
    });

    console.log('Cloudinary Upload Result (test):', uploadResult);

    return {
      certificateUrl: uploadResult.secure_url,
      public_id: uploadResult.public_id,
    };

  } catch (error) {
    console.error('Critial Error during TEST certificate generation or upload:', error);
    throw new Error(`Failed to generate or upload TEST certificate: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

export default generateCertificatePDF;