import { useSelector } from "react-redux";
import FormField from "../common/FormField";

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

export default function ProductBatchSection() {
  const { manufacturing_date, expiry_date, quantity_affected } = useSelector(
    (s) => s.complaint.form
  );

  const expiryDays = daysUntil(expiry_date);
  const isExpired = expiryDays !== null && expiryDays < 0;
  const isNearExpiry = expiryDays !== null && expiryDays >= 0 && expiryDays <= 90;

  const dateOrderInvalid =
    manufacturing_date && expiry_date && new Date(manufacturing_date) >= new Date(expiry_date);

  const highQuantity = quantity_affected && Number(quantity_affected) >= 500;

  return (
    <section>
      <h3 className="section-title">2. Product &amp; Batch Identification</h3>

      <div className="grid grid-cols-2 gap-4">
        <FormField field="product_name" label="Product Name" />
        <FormField field="product_strength_grade" label="Product Strength/Grade" />
        <FormField field="batch_lot_number" label="Batch/Lot Number" />

        <div>
          <FormField field="manufacturing_date" label="Manufacturing Date" type="date" />
          {dateOrderInvalid && (
            <p className="text-[11px] text-red-600 mt-1.5 font-medium">
              Manufacturing date must be before expiry date.
            </p>
          )}
        </div>

        <div>
          <FormField field="expiry_date" label="Expiry Date" type="date" />
          {isExpired && (
            <p className="text-[11px] text-red-600 mt-1.5 font-medium">
              ⚠ Product expired {Math.abs(expiryDays)} day(s) ago.
            </p>
          )}
          {isNearExpiry && (
            <p className="text-[11px] text-amber-600 mt-1.5 font-medium">
              Expires in {expiryDays} day(s) — flag for expedited review.
            </p>
          )}
        </div>

        <div>
          <FormField field="quantity_affected" label="Quantity Affected" type="number" suffix="kg" />
          {highQuantity && (
            <p className="text-[11px] text-orange-600 mt-1.5 font-medium">
              Large affected quantity — likely batch-wide impact, consider escalating severity.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}