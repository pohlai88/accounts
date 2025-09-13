export interface PDFOptions {
    html: string;
    margin?: {
        top?: string;
        right?: string;
        bottom?: string;
        left?: string;
    };
    headerHtml?: string;
    footerHtml?: string;
}
export interface PdfInput extends PDFOptions {
}
export declare function renderPdf({ html, margin, headerHtml, footerHtml }: PdfInput): Promise<Buffer>;
//# sourceMappingURL=pdf.d.ts.map
