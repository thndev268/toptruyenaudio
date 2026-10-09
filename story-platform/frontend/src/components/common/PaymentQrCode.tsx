import React from 'react';
// import { QRCodeSVG } from 'qrcode.react';

interface PaymentQrCodeProps {
  value: string;
  size?: number;
}

export const PaymentQrCode: React.FC<PaymentQrCodeProps> = ({ value, size = 192 }) => {
  if (!value) return null;

  if (value.startsWith('data:image') || value.startsWith('http://') || value.startsWith('https://')) {
    return (
      <img
        src={value}
        alt="QR Code thanh toán"
        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white p-2"
        width={size}
        height={size}
      />
    );
  }

  // Temporarily disabled for Render build - will re-enable after fixing dependency issues
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white p-3 flex items-center justify-center">
      <div className="text-center text-sm text-slate-600">
        <p>QR Code</p>
        <p className="text-xs mt-1">{value.substring(0, 20)}...</p>
      </div>
    </div>
  );

  // Original implementation (disabled for now):
  // return (
  //   <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white p-3">
  //     <QRCodeSVG value={value} size={size} level="M" includeMargin />
  //   </div>
  // );
};
