'use client';

import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Printer, Check, QrCode } from 'lucide-react';

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopName: string;
  gstin?: string;
  phone?: string;
  address?: string;
  invoiceTitle?: string;
  paperSize?: 'A4' | 'THERMAL_80MM' | 'THERMAL_58MM';
  logoUrl?: string;
  headerText?: string;
  footerText?: string;
  showGstNumber?: boolean;
  showTermsAndConditions?: boolean;
  showQrCode?: boolean;
  showBarcode?: boolean;
  showStoreContact?: boolean;
  terms?: string;
  customFooter?: string;
}

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  isOpen,
  onClose,
  shopName,
  gstin = '29ABCDE1234F1Z5',
  phone = '+91 99000 11111',
  address = 'Flagship Store, 100 Feet Road, Indiranagar, Bengaluru - 560038',
  invoiceTitle = 'TAX INVOICE',
  paperSize = 'A4',
  logoUrl,
  headerText = 'Thank you for choosing Washora',
  footerText = 'Please collect garments within 15 days',
  showGstNumber = true,
  showTermsAndConditions = true,
  showQrCode = true,
  showBarcode = true,
  showStoreContact = true,
  terms = 'Washora is not liable for color bleeding on delicate unlabelled fabrics.',
  customFooter = 'For inquiries or pick-up updates, please reach out to our counter.',
}) => {
  const isThermal = paperSize === 'THERMAL_80MM' || paperSize === 'THERMAL_58MM';
  const thermalWidthClass = paperSize === 'THERMAL_58MM' ? 'max-w-[280px]' : 'max-w-[340px]';

  const sampleItems = [
    { name: 'Men Shirt (Cotton)', service: 'Wash & Steam Iron', qty: 3, rate: 70, total: 210 },
    { name: 'Trousers / Chinos', service: 'Dry Clean & Press', qty: 2, rate: 120, total: 240 },
    { name: 'Silk Saree', service: 'Delicate Spa Clean', qty: 1, rate: 350, total: 350 },
  ];

  const subtotal = 800;
  const tax = 40; // 5%
  const grandTotal = 840;
  const paid = 500;
  const due = 340;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Live Print Preview — ${paperSize === 'A4' ? 'A4 Standard Invoice' : paperSize === 'THERMAL_80MM' ? '80mm Thermal Receipt' : '58mm Compact Receipt'}`}
      size={isThermal ? 'md' : 'lg'}
    >
      <div className="space-y-4">
        <div className="flex justify-end gap-2 print:hidden pb-2 border-b border-slate-100 dark:border-slate-800">
          <Button variant="secondary" size="xs" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" size="xs" leftIcon={<Printer className="w-3.5 h-3.5" />} onClick={handlePrint}>
            Print Sample
          </Button>
        </div>

        {/* Paper Container */}
        <div className="flex justify-center bg-slate-100 dark:bg-slate-900/80 p-4 rounded-xl overflow-x-auto">
          {isThermal ? (
            /* THERMAL LAYOUT */
            <div className={`w-full ${thermalWidthClass} bg-white text-black font-mono text-[11px] p-4 shadow-md rounded border border-slate-300 leading-tight space-y-2.5`}>
              {/* Header */}
              <div className="text-center space-y-1">
                {logoUrl && (
                  <img src={logoUrl} alt="Logo" className="h-8 mx-auto object-contain mb-1" />
                )}
                <h2 className="text-sm font-black uppercase tracking-wider">{shopName}</h2>
                {showStoreContact && (
                  <p className="text-[10px] text-gray-700">{address}<br />Tel: {phone}</p>
                )}
                {showGstNumber && gstin && (
                  <p className="text-[10px] font-bold">GSTIN: {gstin}</p>
                )}
                <div className="border-t border-b border-dashed border-gray-400 py-1 my-1">
                  <p className="font-bold uppercase tracking-wider">{invoiceTitle}</p>
                  <p className="text-[10px]">Inv #: WSH-10254 · {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="text-[10px] space-y-0.5 pb-1 border-b border-dashed border-gray-300">
                <p><strong>Customer:</strong> Rahul Verma</p>
                <p><strong>Phone:</strong> +91 98765 43210</p>
              </div>

              {/* Itemization */}
              <table className="w-full text-[10px] text-left">
                <thead>
                  <tr className="border-b border-gray-400">
                    <th className="py-1">Item</th>
                    <th className="py-1 text-center">Qty</th>
                    <th className="py-1 text-right">Amt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dotted divide-gray-200">
                  {sampleItems.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-1">
                        <div className="font-bold">{it.name}</div>
                        <div className="text-[9px] text-gray-600">{it.service}</div>
                      </td>
                      <td className="py-1 text-center">{it.qty}</td>
                      <td className="py-1 text-right font-mono">₹{it.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="border-t border-dashed border-gray-400 pt-1 text-[10px] space-y-0.5">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (5%):</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-xs pt-1 border-t border-gray-800">
                  <span>GRAND TOTAL:</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Advance Paid:</span>
                  <span>₹{paid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-red-600 pt-0.5">
                  <span>BALANCE DUE:</span>
                  <span>₹{due.toFixed(2)}</span>
                </div>
              </div>

              {/* Barcode & QR Code */}
              {(showBarcode || showQrCode) && (
                <div className="text-center pt-2 space-y-1">
                  {showBarcode && (
                    <div className="font-mono text-[9px] tracking-widest bg-gray-100 py-1 rounded border border-gray-300">
                      *WSH-10254*
                    </div>
                  )}
                  {showQrCode && (
                    <div className="flex justify-center items-center gap-1 text-[9px] text-gray-600">
                      <QrCode className="w-5 h-5 text-gray-800" />
                      <span>Scan to track live order</span>
                    </div>
                  )}
                </div>
              )}

              {/* Terms & Footer */}
              <div className="text-center text-[9px] text-gray-600 border-t border-dashed border-gray-300 pt-2 space-y-1">
                {headerText && <p>{headerText}</p>}
                {showTermsAndConditions && terms && (
                  <p className="italic text-[8px]">{terms}</p>
                )}
                {customFooter && <p className="font-medium text-gray-800">{customFooter}</p>}
                <p className="text-[8px] text-gray-400 pt-1">Powered by Washora SaaS</p>
              </div>
            </div>
          ) : (
            /* A4 STANDARD SHEET LAYOUT */
            <div className="w-full max-w-[620px] bg-white text-slate-900 p-8 shadow-md rounded-xl border border-slate-200 text-xs space-y-6">
              {/* Top Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-5">
                <div className="space-y-1">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="h-10 object-contain mb-2" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-blue-600 text-white font-black text-lg flex items-center justify-center">
                      {shopName.charAt(0)}
                    </div>
                  )}
                  <h2 className="text-lg font-black tracking-tight">{shopName}</h2>
                  {showStoreContact && (
                    <p className="text-[11px] text-slate-500 max-w-xs">{address}<br />Phone: {phone}</p>
                  )}
                  {showGstNumber && gstin && (
                    <p className="text-[11px] font-bold text-slate-700">GSTIN: {gstin}</p>
                  )}
                </div>

                <div className="text-right space-y-1">
                  <div className="inline-block px-3 py-1 rounded bg-blue-50 text-blue-700 font-extrabold text-sm uppercase">
                    {invoiceTitle}
                  </div>
                  <p className="text-xs font-mono font-bold text-slate-800">Invoice: WSH-10254</p>
                  <p className="text-xs text-slate-500">Date: {new Date().toLocaleDateString()}</p>
                  <p className="text-xs text-slate-500">Delivery Est: {new Date(Date.now() + 86400000 * 2).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Bill To & Barcode */}
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Billed To Customer</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">Rahul Verma</p>
                  <p className="text-xs text-slate-600">+91 98765 43210 · rahul.verma@example.com</p>
                  <p className="text-xs text-slate-500">Apartment 4B, Prestige Towers, Bengaluru</p>
                </div>

                {showBarcode && (
                  <div className="text-right font-mono text-xs text-slate-600">
                    <div className="bg-white px-3 py-1.5 rounded border border-slate-200 inline-block font-mono tracking-widest font-bold">
                      ||| | ||||| | || |
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Order #WSH-10254</p>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-slate-500 text-[11px]">
                    <th className="py-2 text-left font-bold">#</th>
                    <th className="py-2 text-left font-bold">Garment Item</th>
                    <th className="py-2 text-left font-bold">Service Category</th>
                    <th className="py-2 text-center font-bold">Qty</th>
                    <th className="py-2 text-right font-bold">Rate</th>
                    <th className="py-2 text-right font-bold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sampleItems.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 font-bold text-slate-900">{it.name}</td>
                      <td className="py-2.5 text-slate-600">{it.service}</td>
                      <td className="py-2.5 text-center font-semibold">{it.qty}</td>
                      <td className="py-2.5 text-right text-slate-600">₹{it.rate}</td>
                      <td className="py-2.5 text-right font-bold text-slate-900">₹{it.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary Cards */}
              <div className="flex justify-between items-start pt-2 border-t border-slate-200">
                <div className="space-y-3 max-w-xs">
                  {showQrCode && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50/50 border border-blue-100 text-[11px] text-blue-900">
                      <QrCode className="w-6 h-6 text-blue-600 shrink-0" />
                      <span>Scan QR code with your phone camera to view live order processing progress.</span>
                    </div>
                  )}

                  {showTermsAndConditions && terms && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Terms & Conditions</p>
                      <p className="text-[10px] text-slate-500 leading-relaxed">{terms}</p>
                    </div>
                  )}
                </div>

                <div className="w-56 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-900">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Tax (GST 5%)</span>
                    <span className="font-semibold text-slate-900">₹{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-black text-sm pt-2 border-t border-slate-200 text-slate-900">
                    <span>Grand Total</span>
                    <span>₹{grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-bold pt-1">
                    <span>Paid (Advance)</span>
                    <span>₹{paid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-red-600 font-black pt-1 border-t border-slate-100">
                    <span>Amount Due</span>
                    <span>₹{due.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Custom Footer */}
              <div className="text-center pt-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                {headerText && <p className="font-medium text-slate-700">{headerText}</p>}
                {footerText && <p>{footerText}</p>}
                {customFooter && <p className="text-slate-600 font-medium">{customFooter}</p>}
                <p className="text-[10px] text-slate-400 pt-2">Washora SaaS Platform &bull; Customer Support & Live Tracking</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
