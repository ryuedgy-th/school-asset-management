import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 10,
        fontFamily: 'Helvetica'
    },
    header: {
        marginBottom: 20,
        borderBottom: '2px solid #574193',
        paddingBottom: 10
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#574193',
        textAlign: 'center',
        marginBottom: 5
    },
    subtitle: {
        fontSize: 14,
        color: '#574193',
        textAlign: 'center',
        marginBottom: 3
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        backgroundColor: '#eeeeee',
        padding: 5,
        marginTop: 10,
        marginBottom: 6
    },
    table: {
        width: '100%',
        marginTop: 10
    },
    tableRow: {
        flexDirection: 'row',
        borderBottom: '1px solid #ddd'
    },
    tableHeader: {
        backgroundColor: '#f2f2f2',
        fontWeight: 'bold'
    },
    tableCell: {
        padding: 4,
        fontSize: 9
    },
    photoSection: {
        marginTop: 10,
        marginBottom: 10
    },
    photoContainer: {
        marginBottom: 8,
        border: '1px solid #dee2e6',
        padding: 6,
        backgroundColor: '#f8f9fa'
    },
    photoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 4
    },
    photo: {
        width: '23%',
        marginRight: '2%',
        marginBottom: 3,
        border: '1px solid #ddd'
    },
    agreementBox: {
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        padding: 10,
        marginTop: 10,
        fontSize: 9
    },
    signatureSection: {
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    signatureBox: {
        width: '48%',
        border: '2px solid #6ab42d',
        padding: 8,
        minHeight: 70,
        textAlign: 'center'
    },
    footer: {
        marginTop: 12,
        paddingTop: 8,
        borderTop: '1px solid #dee2e6',
        fontSize: 8,
        color: '#666',
        textAlign: 'center'
    }
});

interface BorrowReceiptPDFProps {
    transaction: {
        transactionNumber: string;
        borrowDate: Date;
        assignment: {
            assignmentNumber: string;
            academicYear: string;
            semester: number;
            user: {
                name: string | null;
                email: string | null;
                department: string | null;
            };
        };
        items: Array<{
            asset: {
                assetCode: string;
                name: string;
                category: string;
            };
            checkoutInspection?: {
                overallCondition: string;
                exteriorCondition?: string | null;
                exteriorNotes?: string | null;
                screenCondition?: string | null;
                screenNotes?: string | null;
                buttonPortCondition?: string | null;
                buttonPortNotes?: string | null;
                keyboardCondition?: string | null;
                keyboardNotes?: string | null;
                touchpadCondition?: string | null;
                batteryHealth?: string | null;
                photoUrls?: string[];
            } | null;
        }>;
        borrowerSignature?: string | null;
        isSigned: boolean;
    };
}

const BorrowReceiptPDF: React.FC<BorrowReceiptPDFProps> = ({ transaction }) => {
    const { assignment, items } = transaction;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>MYIS INTERNATIONAL SCHOOL</Text>
                    <Text style={styles.subtitle}>Teacher Asset Assignment Form</Text>
                    <Text style={{ fontSize: 11, color: '#666', textAlign: 'center' }}>
                        iDevice Essential Agreement
                    </Text>
                </View>

                {/* Teacher Information */}
                <View>
                    <Text style={styles.sectionTitle}>Teacher Information</Text>
                    <View style={{ flexDirection: 'row', marginBottom: 3 }}>
                        <Text style={{ width: '25%', fontWeight: 'bold' }}>Teacher:</Text>
                        <Text style={{ width: '25%' }}>{assignment.user.name}</Text>
                        <Text style={{ width: '25%', fontWeight: 'bold' }}>Email:</Text>
                        <Text style={{ width: '25%' }}>{assignment.user.email}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', marginBottom: 3 }}>
                        <Text style={{ width: '25%', fontWeight: 'bold' }}>Assignment #:</Text>
                        <Text style={{ width: '25%' }}>{assignment.assignmentNumber}</Text>
                        <Text style={{ width: '25%', fontWeight: 'bold' }}>Date:</Text>
                        <Text style={{ width: '25%' }}>
                            {new Date(transaction.borrowDate).toLocaleDateString('en-GB')}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                        <Text style={{ width: '25%', fontWeight: 'bold' }}>Academic Year:</Text>
                        <Text style={{ width: '25%' }}>{assignment.academicYear}</Text>
                        <Text style={{ width: '25%', fontWeight: 'bold' }}>Term:</Text>
                        <Text style={{ width: '25%' }}>Term {assignment.semester}</Text>
                    </View>
                </View>

                {/* Assets Assigned */}
                <View>
                    <Text style={styles.sectionTitle}>Assets Assigned</Text>
                    <View style={styles.table}>
                        <View style={[styles.tableRow, styles.tableHeader]}>
                            <Text style={[styles.tableCell, { width: '10%' }]}>#</Text>
                            <Text style={[styles.tableCell, { width: '50%' }]}>Asset Name</Text>
                            <Text style={[styles.tableCell, { width: '20%' }]}>Category</Text>
                            <Text style={[styles.tableCell, { width: '20%' }]}>Condition</Text>
                        </View>
                        {items.map((item, index) => {
                            const condition = item.checkoutInspection?.overallCondition || 'N/A';
                            const capitalizedCondition = condition.charAt(0).toUpperCase() + condition.slice(1).toLowerCase();
                            return (
                                <View key={index} style={styles.tableRow}>
                                    <Text style={[styles.tableCell, { width: '10%' }]}>{index + 1}</Text>
                                    <Text style={[styles.tableCell, { width: '50%' }]}>{item.asset.name}</Text>
                                    <Text style={[styles.tableCell, { width: '20%' }]}>{item.asset.category}</Text>
                                    <Text style={[styles.tableCell, { width: '20%' }]}>
                                        {capitalizedCondition}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Detailed Condition Assessment per Asset */}
                {items.map((item, itemIndex) => {
                    if (!item.checkoutInspection) return null;

                    const inspection = item.checkoutInspection;
                    const hasDetails = inspection.exteriorCondition || inspection.screenCondition ||
                        inspection.buttonPortCondition || inspection.keyboardCondition ||
                        inspection.touchpadCondition || inspection.batteryHealth;

                    if (!hasDetails && (!inspection.photoUrls || inspection.photoUrls.length === 0)) return null;

                    return (
                        <View key={itemIndex} style={{ marginTop: 10 }}>
                            <Text style={[styles.sectionTitle, { fontSize: 11, backgroundColor: '#e3f2fd' }]}>
                                {item.asset.name} - Condition Details
                            </Text>

                            {hasDetails && (
                                <View style={styles.table}>
                                    <View style={[styles.tableRow, styles.tableHeader]}>
                                        <Text style={[styles.tableCell, { width: '25%' }]}>Component</Text>
                                        <Text style={[styles.tableCell, { width: '25%' }]}>Condition</Text>
                                        <Text style={[styles.tableCell, { width: '50%' }]}>Notes</Text>
                                    </View>
                                    {inspection.exteriorCondition && (
                                        <View style={styles.tableRow}>
                                            <Text style={[styles.tableCell, { width: '25%', fontWeight: 'bold' }]}>Exterior</Text>
                                            <Text style={[styles.tableCell, { width: '25%' }]}>
                                                {inspection.exteriorCondition.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                            </Text>
                                            <Text style={[styles.tableCell, { width: '50%' }]}>
                                                {inspection.exteriorNotes || '-'}
                                            </Text>
                                        </View>
                                    )}
                                    {inspection.screenCondition && (
                                        <View style={styles.tableRow}>
                                            <Text style={[styles.tableCell, { width: '25%', fontWeight: 'bold' }]}>Screen</Text>
                                            <Text style={[styles.tableCell, { width: '25%' }]}>
                                                {inspection.screenCondition.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                            </Text>
                                            <Text style={[styles.tableCell, { width: '50%' }]}>
                                                {inspection.screenNotes || '-'}
                                            </Text>
                                        </View>
                                    )}
                                    {inspection.buttonPortCondition && (
                                        <View style={styles.tableRow}>
                                            <Text style={[styles.tableCell, { width: '25%', fontWeight: 'bold' }]}>Buttons/Ports</Text>
                                            <Text style={[styles.tableCell, { width: '25%' }]}>
                                                {inspection.buttonPortCondition.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                            </Text>
                                            <Text style={[styles.tableCell, { width: '50%' }]}>
                                                {inspection.buttonPortNotes || '-'}
                                            </Text>
                                        </View>
                                    )}
                                    {inspection.keyboardCondition && (
                                        <View style={styles.tableRow}>
                                            <Text style={[styles.tableCell, { width: '25%', fontWeight: 'bold' }]}>Keyboard</Text>
                                            <Text style={[styles.tableCell, { width: '25%' }]}>
                                                {inspection.keyboardCondition.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                            </Text>
                                            <Text style={[styles.tableCell, { width: '50%' }]}>
                                                {inspection.keyboardNotes || '-'}
                                            </Text>
                                        </View>
                                    )}
                                    {inspection.touchpadCondition && (
                                        <View style={styles.tableRow}>
                                            <Text style={[styles.tableCell, { width: '25%', fontWeight: 'bold' }]}>Touchpad</Text>
                                            <Text style={[styles.tableCell, { width: '25%' }]}>
                                                {inspection.touchpadCondition.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                            </Text>
                                            <Text style={[styles.tableCell, { width: '50%' }]}>-</Text>
                                        </View>
                                    )}
                                    {inspection.batteryHealth && (
                                        <View style={styles.tableRow}>
                                            <Text style={[styles.tableCell, { width: '25%', fontWeight: 'bold' }]}>Battery Health</Text>
                                            <Text style={[styles.tableCell, { width: '25%' }]}>
                                                {inspection.batteryHealth.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                            </Text>
                                            <Text style={[styles.tableCell, { width: '50%' }]}>-</Text>
                                        </View>
                                    )}
                                </View>
                            )}

                            {/* Photos for this asset */}
                            {inspection.photoUrls && Array.isArray(inspection.photoUrls) && inspection.photoUrls.length > 0 && (
                                <View style={styles.photoSection}>
                                    <Text style={{ fontSize: 10, color: '#574193', fontWeight: 'bold', marginBottom: 4 }}>
                                        Checkout Photos
                                    </Text>
                                    <View style={styles.photoGrid}>
                                        {inspection.photoUrls.slice(0, 4).map((url: string, idx: number) => (
                                            <Image key={idx} src={url} style={styles.photo} />
                                        ))}
                                    </View>
                                    {inspection.photoUrls.length > 4 && (
                                        <Text style={{ fontSize: 9, color: '#666', marginTop: 2 }}>
                                            (+ {inspection.photoUrls.length - 4} more photos)
                                        </Text>
                                    )}
                                </View>
                            )}
                        </View>
                    );
                })}

                {/* Agreement Terms */}
                <View>
                    <Text style={[styles.sectionTitle, { backgroundColor: '#ffc107' }]}>
                        MYIS iDevice Essential Agreement
                    </Text>
                    <View style={styles.agreementBox}>
                        <Text style={{ fontWeight: 'bold', marginBottom: 6 }}>
                            I agree to abide by MYIS iDevice Essential Agreement.
                        </Text>
                        <Text style={{ marginBottom: 8 }}>
                            In addition to the requirements of the Essential Agreement, I agree to abide by the following terms:
                        </Text>
                        <Text style={{ marginBottom: 3 }}>
                            • I will keep the laptop/device in good working condition and will return it as required by the school.
                        </Text>
                        <Text style={{ marginBottom: 3 }}>
                            • I will keep the laptop/device secure at all times.
                        </Text>
                        <Text style={{ marginBottom: 3 }}>
                            • I will report any problems promptly to the School Technology Team.
                        </Text>
                        <Text style={{ marginBottom: 3 }}>
                            • I agree to reimburse the school for replacement fees in the event of loss, theft or damage due to negligence.
                        </Text>
                    </View>
                </View>

                {/* Signature Section */}
                <View style={styles.signatureSection}>
                    <View style={styles.signatureBox}>
                        <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Teacher Signature:</Text>
                        {transaction.borrowerSignature && transaction.isSigned && (
                            <Image src={transaction.borrowerSignature} style={{ maxHeight: 50, marginVertical: 5 }} />
                        )}
                        <Text style={{ marginTop: 5, fontSize: 9 }}>
                            Name: {assignment.user.name}
                        </Text>
                        <Text style={{ fontSize: 9 }}>
                            Date: {new Date(transaction.borrowDate).toLocaleDateString('en-GB')}
                        </Text>
                    </View>
                    <View style={{ width: '48%', padding: 10, backgroundColor: '#f0f0f0', borderLeft: '3px solid #574193' }}>
                        <Text style={{ fontWeight: 'bold', fontSize: 10, marginBottom: 5 }}>
                            ✅ Verified
                        </Text>
                        <Text style={{ fontSize: 8.5 }}>
                            Signed electronically via MYIS Asset System on{' '}
                            {new Date(transaction.borrowDate).toLocaleDateString('en-GB')}
                        </Text>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>
                        Signed online via MYIS Asset System | ID: {transaction.transactionNumber} | Contact: MYIS IT Department
                    </Text>
                </View>
            </Page>
        </Document>
    );
};

export default BorrowReceiptPDF;
