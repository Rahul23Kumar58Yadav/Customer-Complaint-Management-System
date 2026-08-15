import { useSelector } from "react-redux";
import FormField from "../common/FormField";

const SOURCE_OPTIONS = [
  { value: "Email", label: "Email" },
  { value: "Phone Call", label: "Phone Call" },
  { value: "Customer Portal", label: "Customer Portal" },
  { value: "Regulatory Body", label: "Regulatory Body" },
  { value: "Distributor", label: "Distributor" },
  { value: "Sales Representative", label: "Sales Representative" },
];

const REGULATORY_SOURCES = new Set(["Regulatory Body"]);

export default function OriginCustomerSection() {
  const source = useSelector((s) => s.complaint.form.complaint_source);
  const customerName = useSelector((s) => s.complaint.form.customer_name);

  const isRegulatory = REGULATORY_SOURCES.has(source);
  const nameMissing = !customerName?.trim();

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h3 className="section-title !mb-0">1. Origin &amp; Customer Details</h3>
        {isRegulatory && (
          <span className="text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full shadow-sm">
            ⚠ Regulatory reporting timelines apply
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField field="complaint_source" label="Complaint Source" options={SOURCE_OPTIONS} />

        <div>
          <FormField field="customer_name" label="Customer Name" />
          {nameMissing && (
            <p className="text-[11px] text-amber-600 mt-1.5">
              Required for traceability — complaint cannot be triaged without a customer name.
            </p>
          )}
        </div>
      </div>

      {isRegulatory && (
        <div className="mt-3 text-xs text-red-700 bg-gradient-to-br from-red-50 to-white border border-red-200 rounded-xl px-3.5 py-2.5 leading-relaxed">
          This complaint originates from a regulatory body. Confirm applicable reporting
          deadlines (e.g. Field Alert / MHRA / CDSCO notification windows) once logged.
        </div>
      )}
    </section>
  );
}