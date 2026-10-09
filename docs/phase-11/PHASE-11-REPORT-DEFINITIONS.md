# Washora — Phase 11: Metric Definitions & Financial Disclaimers

## 1. Metric Glossary & Calculations

### 1.1 Sales & Revenue Metrics
- **Gross Sales**: The aggregate sum of all order item subtotal amounts before discounts or promotional deductions (`sum(items.price * items.quantity)`).
- **Discounts**: Total promotional, coupon, and loyalty discounts subtracted from customer orders (`sum(discountAmount)`).
- **Net Sales / Net Revenue**: Gross Sales minus Discounts (`sum(grandTotal - taxAmount)`).
- **Taxes**: Total GST/VAT tax collected on billable orders (`sum(taxAmount)`).
- **Total Invoiced Revenue**: Final gross payable amount after discounts and taxes (`sum(grandTotal)`).
- **Collected Payments**: Sum of all confirmed customer transaction payments processed within the reporting time window (`sum(payment.amount where status = 'COMPLETED')`).
- **Outstanding Balance / Receivables**: Total balance due on active or delivered orders (`sum(order.dueAmount where dueAmount > 0)`).
- **Average Order Value (AOV)**: Net sales divided by total order count (`Net Sales / Order Count`). Returns `0` when order count is `0`.

### 1.2 Customer Analytics & Retention Segments
- **New Customers**: Customers who created their first order within the active reporting date range.
- **Returning Customers**: Customers who had at least one order prior to the reporting period and placed another order during the period.
- **Repeat Customer Rate**: Percentage of customers with $\ge 2$ lifetime orders (`(Customers with 2+ Orders / Total Customers) * 100`).
- **Customer Segmentation Rules**:
  - `New`: Customer registered within the last 30 days.
  - `High Value`: Customer lifetime spend $> ₹10,000$ (or equivalent local currency unit) and $\ge 5$ lifetime orders.
  - `Active`: Customer placed an order within the last 45 days.
  - `At Risk`: Previously active customer whose last order was between 45 and 90 days ago.
  - `Inactive`: Customer with zero orders in the last 90+ days.
- **Cohort Retention Rate**: Percentage of a monthly acquisition cohort that placed subsequent orders in month $M+1, M+2, \dots, M+N$.

### 1.3 Operations & Processing Metrics
- **Plant Processing SLA Duration**: Average hours elapsed between order intake/check-in and plant packing completion (`avg(completedAt - checkedInAt)`).
- **Stage Cycle Time**: Mean duration (in minutes or hours) garments spend in each distinct operational stage (`SORTING`, `WASHING`, `DRYING`, `IRONING`, `PACKING`).
- **QC Pass Rate**: Percentage of quality inspection checks marked `PASSED` (`(QC Passed / Total Inspections) * 100`).
- **QC Rework Rate**: Percentage of garments flagged with defects requiring re-washing or re-pressing (`(QC Failed / Total Inspections) * 100`).

### 1.4 Logistics & Dispatch Metrics
- **Pickup Success Rate**: `(Completed Pickups / Total Scheduled Pickups) * 100`.
- **Delivery Success Rate**: `(Completed Deliveries / Total Out for Delivery) * 100`.
- **Average Delivery Transit Time**: Mean minutes from driver pickup dispatch to customer drop-off confirmation.

### 1.5 Finance & Inventory Metrics
- **Operating Expenses**: Sum of all recorded operational business expenses within the time period (`sum(expense.amount)`).
- **Direct Material Cost / Stock Consumption**: Cost of inventory consumed for cleaning agents, detergents, solvents, and packaging materials (`sum(movement.quantity * movement.unitCost)`).
- **Estimated Operational Profit**: Operational margin calculated as:
  $$\text{Estimated Profit} = \text{Net Sales} - (\text{Direct Expenses} + \text{Inventory Consumed} + \text{Payroll Paid})$$
- **Total Stock Valuation**: Current physical inventory valuation based on weighted average cost:
  $$\text{Stock Valuation} = \sum (\text{Current Stock Quantity} \times \text{Weighted Average Unit Cost})$$

---

## 2. Regulatory & Accounting Disclaimers

> [!IMPORTANT]
> **Operational Management Tool vs. Statutory Accounting**
> Washora's Financial Reports and Profit Calculations represent **internal operational management metrics** designed for shop managers and business owners to track daily unit economics and workflow performance.
>
> 1. Washora Phase 11 reports **DO NOT** constitute a legally compliant General Ledger, Double-Entry Accounting System, GAAP, or IFRS statutory financial statement.
> 2. Metrics labeled as *Estimated Operational Profit* exclude non-operating items such as depreciation, tax amortization, capital expenditures (CapEx), deferred revenues, and loan amortizations unless explicitly booked as manual expense entries.
> 3. Business owners should consult a certified chartered accountant for statutory tax filings and official financial balance sheets.
