import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { writeFile, mkdir, readFile } from 'fs/promises';
import path from 'path';

/**
 * Generate Enhanced Damage Acknowledgement PDF
 * With school logo, multiple signatures, and damage photos
 */
export async function generateDamageAcknowledgementPDF(data: {
    inspectionId: number;
    asset: {
        name: string;
        assetCode: string;
        category: string;
    };
    user: {
        name: string;
        email: string | null;
        department: string | null;
    };
    damageDescription: string | null;
    estimatedCost: number;
    inspectionDate: Date;
    borrowDate: Date | null;
    photoUrls?: string[] | null;
}): Promise<string> {
    // Create PDF directory
    const pdfDir = path.join(process.cwd(), 'public', 'damage-forms');
    await mkdir(pdfDir, { recursive: true });

    // Generate filename
    const filename = `damage-form-${data.inspectionId}-${Date.now()}.pdf`;
    const filepath = path.join(pdfDir, filename);

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();

    // Register fontkit for custom font support
    pdfDoc.registerFontkit(fontkit);

    const page = pdfDoc.addPage([595, 842]); // A4 size in points

    // Embed fonts
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Embed Thai font for damage description
    let thaiFont;
    try {
        const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Sarabun-Regular.ttf');
        const fontBytes = await readFile(fontPath);
        thaiFont = await pdfDoc.embedFont(fontBytes);
    } catch (error) {
        console.warn('Failed to load Thai font, using regular font:', error);
        thaiFont = regularFont; // Fallback to regular font
    }

    const { width, height } = page.getSize();
    let yPosition = height - 40;

    // ===== HEADER SECTION WITH LOGO =====
    // Embed school logo
    try {
        const logoPath = path.join(process.cwd(), 'public', 'images', 'school-logo.png');
        const logoBytes = await readFile(logoPath);
        const logoImage = await pdfDoc.embedPng(logoBytes);

        const logoDims = logoImage.scale(0.12); // Smaller scale
        page.drawImage(logoImage, {
            x: 50,
            y: yPosition - 55,
            width: logoDims.width,
            height: logoDims.height,
        });
    } catch (error) {
        console.warn('Failed to load logo, using placeholder:', error);
        // Fallback to placeholder box
        page.drawRectangle({
            x: 50,
            y: yPosition - 55,
            width: 70,
            height: 45,
            borderColor: rgb(0.7, 0.7, 0.7),
            borderWidth: 1,
        });
    }

    // School name and title (moved right to avoid logo overlap)
    page.drawText('MYIS INTERNATIONAL SCHOOL', {
        x: 170,
        y: yPosition - 20,
        size: 11,
        font: boldFont,
    });

    page.drawText('LOSS/DAMAGE ACKNOWLEDGEMENT FORM', {
        x: 170,
        y: yPosition - 40,
        size: 13,
        font: boldFont,
        color: rgb(0.8, 0, 0),
    });

    yPosition -= 70;

    // Form Number and Date (right-aligned)
    const formNo = `Form No: DAF-${data.inspectionId.toString().padStart(6, '0')}`;
    const dateStr = `Date: ${new Date().toLocaleDateString('en-GB')}`;
    page.drawText(formNo, {
        x: width - 200,
        y: yPosition,
        size: 9,
        font: regularFont,
    });
    yPosition -= 12;
    page.drawText(dateStr, {
        x: width - 200,
        y: yPosition,
        size: 9,
        font: regularFont,
    });
    yPosition -= 20;

    // Horizontal line
    page.drawLine({
        start: { x: 50, y: yPosition },
        end: { x: width - 50, y: yPosition },
        thickness: 2,
        color: rgb(0, 0, 0),
    });
    yPosition -= 25;

    // ===== SECTION 1: EQUIPMENT INFORMATION =====
    // Section header with background
    page.drawRectangle({
        x: 50,
        y: yPosition - 18,
        width: width - 100,
        height: 18,
        color: rgb(0.95, 0.95, 0.95),
    });
    page.drawText('1. EQUIPMENT INFORMATION', {
        x: 55,
        y: yPosition - 13,
        size: 11,
        font: boldFont,
    });
    yPosition -= 30;

    // Equipment details in table format
    const drawField = (label: string, value: string, y: number) => {
        page.drawText(label, { x: 70, y, size: 9, font: regularFont });
        page.drawText(value, { x: 200, y, size: 9, font: boldFont });
    };

    // Asset Code removed per user request
    drawField('Equipment Name:', data.asset.name, yPosition);
    yPosition -= 15;
    drawField('Category:', data.asset.category, yPosition);
    yPosition -= 25;

    // ===== SECTION 2: BORROWER INFORMATION =====
    page.drawRectangle({
        x: 50,
        y: yPosition - 18,
        width: width - 100,
        height: 18,
        color: rgb(0.95, 0.95, 0.95),
    });
    page.drawText('2. BORROWER INFORMATION', {
        x: 55,
        y: yPosition - 13,
        size: 11,
        font: boldFont,
    });
    yPosition -= 30;

    drawField('Name:', data.user.name, yPosition);
    yPosition -= 15;
    drawField('Department:', data.user.department || 'N/A', yPosition);
    yPosition -= 15;
    if (data.borrowDate) {
        drawField('Borrow Date:', new Date(data.borrowDate).toLocaleDateString('en-GB'), yPosition);
        yPosition -= 25;
    } else {
        yPosition -= 10;
    }

    // ===== SECTION 3: DAMAGE DETAILS =====
    page.drawRectangle({
        x: 50,
        y: yPosition - 18,
        width: width - 100,
        height: 18,
        color: rgb(0.95, 0.95, 0.95),
    });
    page.drawText('3. DAMAGE DETAILS', {
        x: 55,
        y: yPosition - 13,
        size: 11,
        font: boldFont,
    });
    yPosition -= 30;

    drawField('Inspection Date:', new Date(data.inspectionDate).toLocaleDateString('en-GB'), yPosition);
    yPosition -= 20;

    // Description box
    page.drawText('Description of Damage:', { x: 70, y: yPosition, size: 9, font: regularFont });
    yPosition -= 8;

    page.drawRectangle({
        x: 70,
        y: yPosition - 60,
        width: 455,
        height: 60,
        borderColor: rgb(0.7, 0.7, 0.7),
        borderWidth: 1,
    });

    const description = data.damageDescription || 'No description provided';
    page.drawText(description, {
        x: 75,
        y: yPosition - 15,
        size: 8,
        font: thaiFont,
        maxWidth: 445,
        lineHeight: 11,
    });
    yPosition -= 75;

    // Estimated Cost (highlighted)
    page.drawRectangle({
        x: 70,
        y: yPosition - 25,
        width: 200,
        height: 25,
        color: rgb(1, 0.95, 0.95),
        borderColor: rgb(0.8, 0, 0),
        borderWidth: 1,
    });
    page.drawText('Estimated Repair Cost:', { x: 75, y: yPosition - 10, size: 9, font: regularFont });
    page.drawText(`฿${data.estimatedCost.toLocaleString()}`, {
        x: 75,
        y: yPosition - 22,
        size: 13,
        font: thaiFont,
        color: rgb(0.8, 0, 0),
    });
    yPosition -= 40;

    // ===== SECTION 4: ACKNOWLEDGEMENT =====
    page.drawRectangle({
        x: 50,
        y: yPosition - 18,
        width: width - 100,
        height: 18,
        color: rgb(0.95, 0.95, 0.95),
    });
    page.drawText('4. ACKNOWLEDGEMENT', {
        x: 55,
        y: yPosition - 13,
        size: 11,
        font: boldFont,
    });
    yPosition -= 25;

    const ackText = 'I acknowledge that the above equipment was damaged while in my possession. I understand that:';
    page.drawText(ackText, {
        x: 70,
        y: yPosition,
        size: 8,
        font: regularFont,
        maxWidth: 455,
    });
    yPosition -= 15;

    const bulletPoints = [
        '1. I am responsible for the care and proper use of school equipment.',
        '2. The estimated repair cost shown above is subject to final assessment.',
        '3. I may be required to cover the repair costs as per school policy.',
        '4. I will cooperate with the IT Department for equipment repair or replacement.'
    ];

    bulletPoints.forEach(point => {
        page.drawText(point, {
            x: 85,
            y: yPosition,
            size: 8,
            font: regularFont,
            maxWidth: 440,
        });
        yPosition -= 12;
    });

    yPosition -= 15;

    // ===== SIGNATURE SECTIONS (4 signatures in 2x2 grid, centered) =====
    const sigY = yPosition;
    const sigWidth = 220;
    const sigHeight = 85; // Increased from 70 for better spacing

    // Calculate center position for 2 boxes
    const centerStart = (width - (sigWidth * 2 + 15)) / 2; // 15 = gap between boxes

    // Row 1: Borrower and IT Department (centered)
    // Borrower Signature (left, centered)
    page.drawRectangle({
        x: centerStart,
        y: sigY - sigHeight,
        width: sigWidth,
        height: sigHeight,
        borderColor: rgb(0.7, 0.7, 0.7),
        borderWidth: 0.5,
    });
    page.drawText('Borrower Signature:', { x: centerStart + 10, y: sigY - 15, size: 9, font: boldFont });
    page.drawLine({
        start: { x: centerStart + 10, y: sigY - 45 },
        end: { x: centerStart + 200, y: sigY - 45 },
        thickness: 0.5,
    });
    page.drawText('(Signature)', { x: centerStart + 90, y: sigY - 54, size: 7, font: regularFont, color: rgb(0.5, 0.5, 0.5) });
    page.drawText(`Name: ${data.user.name}`, { x: centerStart + 10, y: sigY - 65, size: 8, font: regularFont });
    page.drawText('Date: _______________', { x: centerStart + 10, y: sigY - 77, size: 8, font: regularFont });

    // IT Department (right, centered)
    page.drawRectangle({
        x: centerStart + sigWidth + 15,
        y: sigY - sigHeight,
        width: sigWidth,
        height: sigHeight,
        borderColor: rgb(0.7, 0.7, 0.7),
        borderWidth: 0.5,
    });
    page.drawText('IT Department:', { x: centerStart + sigWidth + 25, y: sigY - 15, size: 9, font: boldFont });
    page.drawLine({
        start: { x: centerStart + sigWidth + 25, y: sigY - 45 },
        end: { x: centerStart + sigWidth + 215, y: sigY - 45 },
        thickness: 0.5,
    });
    page.drawText('(Signature)', { x: centerStart + sigWidth + 105, y: sigY - 54, size: 7, font: regularFont, color: rgb(0.5, 0.5, 0.5) });
    page.drawText('Name: _______________', { x: centerStart + sigWidth + 25, y: sigY - 65, size: 8, font: regularFont });
    page.drawText('Date: _______________', { x: centerStart + sigWidth + 25, y: sigY - 77, size: 8, font: regularFont });

    yPosition = sigY - sigHeight - 10;

    // Row 2: Finance Office and Director of Operations (centered)
    const sig2Y = yPosition;

    // Finance Office (left, centered)
    page.drawRectangle({
        x: centerStart,
        y: sig2Y - sigHeight,
        width: sigWidth,
        height: sigHeight,
        borderColor: rgb(0.7, 0.7, 0.7),
        borderWidth: 0.5,
    });
    page.drawText('Finance Office:', { x: centerStart + 10, y: sig2Y - 15, size: 9, font: boldFont });
    page.drawLine({
        start: { x: centerStart + 10, y: sig2Y - 45 },
        end: { x: centerStart + 200, y: sig2Y - 45 },
        thickness: 0.5,
    });
    page.drawText('(Signature)', { x: centerStart + 90, y: sig2Y - 54, size: 7, font: regularFont, color: rgb(0.5, 0.5, 0.5) });
    page.drawText('Name: _______________', { x: centerStart + 10, y: sig2Y - 65, size: 8, font: regularFont });
    page.drawText('Date: _______________', { x: centerStart + 10, y: sig2Y - 77, size: 8, font: regularFont });

    // Director of Operations (right, centered)
    page.drawRectangle({
        x: centerStart + sigWidth + 15,
        y: sig2Y - sigHeight,
        width: sigWidth,
        height: sigHeight,
        borderColor: rgb(0.7, 0.7, 0.7),
        borderWidth: 0.5,
    });
    page.drawText('Director of Operations:', { x: centerStart + sigWidth + 25, y: sig2Y - 15, size: 9, font: boldFont });
    page.drawLine({
        start: { x: centerStart + sigWidth + 25, y: sig2Y - 45 },
        end: { x: centerStart + sigWidth + 215, y: sig2Y - 45 },
        thickness: 0.5,
    });
    page.drawText('(Signature)', { x: centerStart + sigWidth + 105, y: sig2Y - 54, size: 7, font: regularFont, color: rgb(0.5, 0.5, 0.5) });
    page.drawText('Name: _______________', { x: centerStart + sigWidth + 25, y: sig2Y - 65, size: 8, font: regularFont });
    page.drawText('Date: _______________', { x: centerStart + sigWidth + 25, y: sig2Y - 77, size: 8, font: regularFont });



    // Save PDF
    const pdfBytes = await pdfDoc.save();
    await writeFile(filepath, pdfBytes);

    return `/damage-forms/${filename}`;
}
