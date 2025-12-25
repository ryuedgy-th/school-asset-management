# Manual UI Patch - Transaction Signature Buttons

## Problem
The "Request Signature" button is not showing for unsigned transactions.

## Solution
Replace lines 185-190 in `src/app/dashboard/borrowing/[id]/AssignDetailClient.tsx`

### Find this code (around line 185):
```tsx
{tx.borrowerSignature && (
    <div className="text-right">
        <div className="text-xs text-slate-400 mb-1">Borrower Signature</div>
        <img src={tx.borrowerSignature} alt="Signature" className="h-8 object-contain border border-slate-100 bg-slate-50 rounded" />
    </div>
)}
```

### Replace with:
```tsx
{tx.isSigned && tx.borrowerSignature ? (
    <div className="text-right">
        <div className="text-xs text-emerald-600 mb-1">✅ Signed</div>
        <img src={tx.borrowerSignature} alt="Signature" className="h-8 object-contain border border-slate-100 bg-slate-50 rounded" />
    </div>
) : (
    <button
        onClick={async () => {
            try {
                const { generateBorrowTransactionToken } = await import('@/app/lib/borrow-transaction-signature');
                const res = await generateBorrowTransactionToken(tx.id);
                if (res.success && res.url) {
                    await navigator.clipboard.writeText(res.url);
                    alert('✅ Signature link copied to clipboard!');
                } else {
                    alert('❌ ' + (res.error || 'Failed to generate link'));
                }
            } catch (e: any) {
                console.error(e);
                alert('❌ Error: ' + e.message);
            }
        }}
        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-sm font-medium transition-all"
    >
        📝 Request Signature
    </button>
)}
```

## What This Does
- Shows "✅ Signed" with signature image if transaction is signed
- Shows "📝 Request Signature" button if transaction is NOT signed
- Clicking button generates signature link and copies to clipboard
- User can then send link to teacher to sign

## After Making This Change
1. Save the file
2. Refresh the browser
3. You should see "📝 Request Signature" button for unsigned transactions
4. Click it to copy the signature link
5. Send link to teacher
6. Teacher opens link and signs
7. Button will change to "✅ Signed" with signature image
