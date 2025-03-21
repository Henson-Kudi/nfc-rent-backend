import { Inject, Service } from 'typedi';
import { HtmlCompilerService } from './html-compiler.service';
// import { PDFDocument } from 'pdf-lib';
import puppeteer, { PaperFormat, PDFMargin } from 'puppeteer';
import envConf from '@/config/env.conf';
import cuid2 from '@paralleldrive/cuid2';
import { FileStorageService } from './file-storage.service';

@Service()
export class PdfService {
  private readonly adminPdfPassword = envConf.pdfAdminPassword;

  constructor(
    @Inject()
    private htmlCompiler: HtmlCompilerService,
    @Inject()
    private storageService: FileStorageService
  ) {}

  generatePdfFromTemplate<T = unknown>(
    templatePath: string,
    data: T,
    options?: {
      password?: string;
      sign?: {
        certificate: Buffer;
        privateKey: Buffer;
      };
      format?: PaperFormat;
      margin?: PDFMargin;
    }
  ): Promise<Buffer> {
    const compiledTemplate = this.htmlCompiler.compile(templatePath, data);

    return this.generatePdfBuffer(compiledTemplate, options);
  }
  // This service is a placeholder for PDF generation logic.
  // You can implement methods to generate PDFs as needed.
  generatePdfFromString<T = unknown>(
    string: string,
    data: T,
    options?: {
      password?: string;
      sign?: {
        certificate: Buffer;
        privateKey: Buffer;
      };
      format?: PaperFormat;
      margin?: PDFMargin;
    }
  ): Promise<Buffer> {
    return this.generatePdfBuffer(
      this.htmlCompiler.compileFromString(string, data),
      options
    );
  }

  async savePdfToCloud(
    pdfBuffer: Buffer,
    path: string = `public/pdf/${Date.now()}-${cuid2.createId()}.pdf`
  ): Promise<string> {
    // 1. Save the PDF to cloud storage (e.g., AWS S3, Google Cloud Storage, etc.)
    const savedFilePath = await this.storageService.uploadFile(pdfBuffer, path);
    return savedFilePath;
  }

  private async generatePdfBuffer(
    html: string,
    options?: {
      password?: string;
      sign?: {
        certificate: Buffer;
        privateKey: Buffer;
      };
      format?: PaperFormat;
      margin?: PDFMargin;
    }
  ): Promise<Buffer> {
    // 2. Generate PDF with Puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.emulateMediaType('screen');
    // await page.setViewport({ width: 1200, height: 800 }); // will use for testing different options for the perfect pdf generation
    await page.addStyleTag({
      content:
        '@page { margin-top: 0px; margin-bottom: 0px; margin-right: 0px; margin-left: 0px; }',
    });
    const pdfBuffer = await page.pdf({
      format: options?.format,
      margin: options?.margin,
      printBackground: true,
    });

    await browser.close();

    // 3. Handle PDF options /**Implement pdf protection and signing later on */
    // if (options?.password) {

    //     const pdfDoc = await PDFDocument.load(pdfBuffer);

    //     const encryptedPdf = await pdfDoc.encrypt({
    //         userPassword: options.password,
    //         ownerPassword: this.adminPdfPassword,
    //         permissions: {
    //             printing: 'highResolution',
    //             modifying: false,
    //             copying: false,
    //             annotating: false,
    //             fillingForms: false,
    //             contentAccessibility: false,
    //             documentAssembly: false,
    //         },
    //         encryptionAlgorithm: 'aes256',
    //         allow: ['print', 'copy', 'modify'],
    //     });
    // }

    // if (options?.sign) {
    //     return this.qpdf.sign(pdfBuffer, {
    //         certFile: options.sign.certificate,
    //         keyFile: options.sign.privateKey
    //     });
    // }
    // 4. Return the PDF buffer
    return pdfBuffer as Buffer;
  }
}
