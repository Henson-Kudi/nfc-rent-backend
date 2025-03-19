import { Inject, Service } from "typedi";
import { HtmlCompilerService } from "./html-compiler.service";
import { PDFDocument } from "pdf-lib";
import puppeteer from "puppeteer";

@Service()
export class PdfService {
    private readonly adminPdfPassword = "admin1234"; // TODO: Move to env variable

    constructor(
        @Inject()
        private htmlCompiler: HtmlCompilerService,
    ) { }

    async generatePdfFromTemplate(
        template: string,
        data: Record<string, any>,
        options?: {
            password?: string;
            sign?: {
                certificate: Buffer;
                privateKey: Buffer;
            };
            format?: 'A4' | 'Letter';
            margin?: { top: string; right: string; bottom: string; left: string; };
        }
    ): Promise<Buffer> {
        const compiledTemplate = this.htmlCompiler.compile(template, data);

        // 2. Generate PDF with Puppeteer
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(compiledTemplate, { waitUntil: 'networkidle0' });
        await page.emulateMediaType('screen');
        // await page.setViewport({ width: 1200, height: 800 }); // will use for testing different options for the perfect pdf generation
        let pdfBuffer = await page.pdf({ format: 'A4' });

        await browser.close();

        if (options?.password) {

            const pdfDoc = await PDFDocument.load(pdfBuffer);

            const encryptedPdf = await pdfDoc.encrypt({
                userPassword: options.password,
                ownerPassword: this.adminPdfPassword,
                permissions: {
                    printing: 'highResolution',
                    modifying: false,
                    copying: false,
                    annotating: false,
                    fillingForms: false,
                    contentAccessibility: false,
                    documentAssembly: false,
                },
                encryptionAlgorithm: 'aes256',
                allow: ['print', 'copy', 'modify'],
            });
        }

        if (options?.sign) {
            return this.qpdf.sign(pdfBuffer, {
                certFile: options.sign.certificate,
                keyFile: options.sign.privateKey
            });
        }

        return pdfBuffer;
    }
    // This service is a placeholder for PDF generation logic.
    // You can implement methods to generate PDFs as needed.
    generatePdf(data: any): Buffer {
        // Placeholder for PDF generation logic
        return Buffer.from("PDF content here", "utf-8");
    }
}