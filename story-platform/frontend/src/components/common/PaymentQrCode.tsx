import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

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

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white p-3">
      <QRCodeSVG value={value} size={size} level="M" includeMargin />
    </div>
  );
};
