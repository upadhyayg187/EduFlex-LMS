import puppeteer from 'puppeteer-core';
import ejs from 'ejs';
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

// Helper to get __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const generateCertificatePDF = async (certificateData) => {
  let browser;
  try {
    const templatePath = path.join(__dirname, '../templates/certificate.ejs');

    const html = await ejs.renderFile(templatePath, {
      studentName: certificateData.studentName,
      courseTitle: certificateData.courseTitle,
      instructorName: certificateData.instructorName || 'EduFlex Instructors',
      completionDate: certificateData.completionDate,
      certificateId: certificateData.certificateId,
      platformName: certificateData.platformName || 'EduFlex',
      platformLogoUrl: certificateData.platformLogoUrl
    });

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      // USE THE STABLE PATH HERE
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    });
    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm'
      }
    });

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'lms-certificates',
          resource_type: 'raw', // FIX: Use 'raw' for PDF files
          public_id: `certificate_${certificateData.certificateId}`,
          format: 'pdf',
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      ).end(pdfBuffer);
    });

    return {
      certificateUrl: uploadResult.secure_url,
      public_id: uploadResult.public_id,
    };

  } catch (error) {
    console.error('Error generating or uploading certificate PDF:', error);
    throw new Error('Failed to generate or upload certificate.');
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

export default generateCertificatePDF;