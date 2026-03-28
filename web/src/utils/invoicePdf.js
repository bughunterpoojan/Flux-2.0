import { jsPDF } from 'jspdf';

const formatCurrency = (value) => `Rs ${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-IN');
};

const unique = (values) => Array.from(new Set(values.filter(Boolean)));

const getFarmerNames = (order) => {
  const names = unique((order.items || []).map((item) => item.farmer_name));
  return names.length > 0 ? names.join(', ') : 'Farmer';
};

export const generateOrderInvoicePdf = ({ order, viewerRole, viewerProfile }) => {
  if (!order) return;

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const marginX = 40;
  const headerTop = 28;

  const lineColor = [226, 232, 240];
  const textDark = [15, 23, 42];
  const textMuted = [100, 116, 139];
  const primary = [22, 163, 74];
  const accent = [56, 189, 248];

  const items = order.items || [];
  const subtotal = items.reduce((sum, item) => {
    const qty = Number(item.quantity || 0);
    const price = Number(item.price_at_order || 0);
    return sum + qty * price;
  }, 0);
  const deliveryFee = Number(order.delivery_fee || 0);
  const extraShipping = Number(order.additional_shipping_fee || 0);
  const total = Number(order.total_amount || subtotal + deliveryFee + extraShipping);

  const billTo = viewerRole === 'buyer'
    ? (viewerProfile?.business_name || viewerProfile?.username || 'Buyer')
    : (order.buyer_name || 'Buyer');
  const billFrom = viewerRole === 'buyer'
    ? getFarmerNames(order)
    : (viewerProfile?.business_name || viewerProfile?.username || 'Farmer');

  doc.setFillColor(primary[0], primary[1], primary[2]);
  doc.roundedRect(marginX, headerTop, pageWidth - marginX * 2, 96, 18, 18, 'F');
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.circle(pageWidth - marginX - 48, headerTop + 22, 58, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.text('Agro Sync Invoice', marginX + 18, headerTop + 40);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Invoice #INV-${String(order.id).padStart(6, '0')}`, marginX + 18, headerTop + 62);
  doc.text(`Issued: ${formatDateTime(order.created_at)}`, marginX + 18, headerTop + 78);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Status: ${(order.status || '').toUpperCase() || 'PENDING'}`, pageWidth - marginX - 160, headerTop + 62);

  let y = headerTop + 126;

  doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
  doc.setLineWidth(1);
  doc.roundedRect(marginX, y, pageWidth - marginX * 2, 98, 12, 12, 'S');

  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Bill From', marginX + 16, y + 24);
  doc.text('Bill To', marginX + 280, y + 24);

  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(billFrom, marginX + 16, y + 46, { maxWidth: 240 });
  doc.text(billTo, marginX + 280, y + 46, { maxWidth: 240 });

  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Address: ${viewerProfile?.address || '-'}`, marginX + 16, y + 68, { maxWidth: 240 });
  doc.text(`Order Date: ${formatDateTime(order.created_at)}`, marginX + 280, y + 68, { maxWidth: 240 });
  doc.text(`Updated: ${formatDateTime(order.updated_at)}`, marginX + 280, y + 84, { maxWidth: 240 });

  y += 118;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(marginX, y, pageWidth - marginX * 2, 30, 8, 8, 'F');

  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Item', marginX + 12, y + 20);
  doc.text('Qty', marginX + 250, y + 20);
  doc.text('Unit Price', marginX + 330, y + 20);
  doc.text('Line Total', marginX + 450, y + 20);

  y += 38;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);

  if (items.length === 0) {
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('No item details available for this order.', marginX + 12, y + 8);
    y += 28;
  } else {
    items.forEach((item) => {
      const qty = Number(item.quantity || 0);
      const price = Number(item.price_at_order || 0);
      const lineTotal = qty * price;

      if (y > pageHeight - 170) {
        doc.addPage();
        y = 58;
      }

      doc.text(item.product_name || `Product #${item.product || '-'}`, marginX + 12, y, { maxWidth: 220 });
      doc.text(String(qty), marginX + 250, y);
      doc.text(formatCurrency(price), marginX + 330, y);
      doc.text(formatCurrency(lineTotal), marginX + 450, y);

      doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
      doc.line(marginX + 10, y + 8, pageWidth - marginX - 10, y + 8);
      y += 24;
    });
  }

  y += 14;
  if (y > pageHeight - 170) {
    doc.addPage();
    y = 58;
  }

  const summaryX = pageWidth - marginX - 220;
  const summaryWidth = 220;
  doc.roundedRect(summaryX, y, summaryWidth, 116, 10, 10, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('Payment Summary', summaryX + 12, y + 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.text('Subtotal', summaryX + 12, y + 44);
  doc.text(formatCurrency(subtotal), summaryX + 205, y + 44, { align: 'right' });

  doc.text('Delivery Fee', summaryX + 12, y + 64);
  doc.text(formatCurrency(deliveryFee), summaryX + 205, y + 64, { align: 'right' });

  doc.text('Extra Shipping', summaryX + 12, y + 84);
  doc.text(formatCurrency(extraShipping), summaryX + 205, y + 84, { align: 'right' });

  doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
  doc.line(summaryX + 10, y + 90, summaryX + summaryWidth - 10, y + 90);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(primary[0], primary[1], primary[2]);
  doc.text('Total', summaryX + 12, y + 108);
  doc.text(formatCurrency(total), summaryX + 205, y + 108, { align: 'right' });

  const footerY = pageHeight - 44;
  doc.setDrawColor(lineColor[0], lineColor[1], lineColor[2]);
  doc.line(marginX, footerY - 18, pageWidth - marginX, footerY - 18);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text('This is a system-generated invoice for your Agro Sync transaction.', marginX, footerY);
  doc.text('Thank you for supporting transparent trade with Agro Sync.', pageWidth - marginX, footerY, { align: 'right' });

  const roleSuffix = viewerRole === 'farmer' ? 'farmer' : 'buyer';
  doc.save(`invoice-order-${String(order.id).padStart(4, '0')}-${roleSuffix}.pdf`);
};
