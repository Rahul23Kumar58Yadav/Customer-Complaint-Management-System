import { useSelector } from "react-redux";
import FormField from "../common/FormField";

const COMPLAINT_TYPE_OPTIONS = [
  { value: "Product Quality Defect", label: "Product Quality Defect" },
  { value: "Packaging Damage", label: "Packaging Damage" },
  { value: "Adverse Event", label: "Adverse Event" },
  { value: "Documentation Discrepancy", label: "Documentation Discrepancy" },
  { value: "Delivery/Shipping Issue", label: "Delivery/Shipping Issue" },
  { value: "Contamination", label: "Contamination" },
];

const MIN_QUALITY_LENGTH = 40;
const MAX_LENGTH = 2000;

const PLACEHOLDER_BY_TYPE = {
  "Product Quality Defect": "Describe the defect observed, % of units affected, and when/where it was found...",
  "Packaging Damage": "Describe the packaging issue (seal, foil, carton), extent of damage, and whether product integrity is compromised...",
  "Adverse Event": "Describe the adverse event, patient impact if known, and whether it has been reported to pharmacovigilance...",
  "Documentation Discrepancy": "Describe the specific document (COA, label, insert) and the discrepancy found...",
  "Delivery/Shipping Issue": "Describe the shipping/delivery issue, storage conditions during transit, and any temperature excursions...",
  "Contamination": "Describe the suspected contaminant, how it was identified, and affected quantity...",
};

export default function ComplaintDetailsSection() {
  const complaintType = useSelector((s) => s.complaint.form.complaint_type);
  const description = useSelector((s) => s.complaint.form.detailed_description) || "";

  const length = description.length;
  const tooShort = length > 0 && length < MIN_QUALITY_LENGTH;
  const placeholder = PLACEHOLDER_BY_TYPE[complaintType] || "Awaiting AI extraction...";

  return (
    <section>
      <h3 className="section-title">3. Complaint Details</h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <FormField field="complaint_type" label="Complaint Type" options={COMPLAINT_TYPE_OPTIONS} />
        <FormField field="complaint_date" label="Complaint Date" type="date" />
      </div>

      <FormField
        field="detailed_description"
        label="Detailed Complaint Description"
        type="textarea"
        placeholder={placeholder}
      />

      <div className="flex items-center justify-between mt-1.5">
        <p className={`text-[11px] font-medium ${tooShort ? "text-amber-600" : "text-gray-400"}`}>
          {tooShort
            ? `Add more detail (min ${MIN_QUALITY_LENGTH} chars) for accurate AI risk assessment.`
            : "\u00A0"}
        </p>
        <p className={`text-[11px] font-medium tabular-nums ${length > MAX_LENGTH ? "text-red-600" : "text-gray-400"}`}>
          {length}/{MAX_LENGTH}
        </p>
      </div>
    </section>
  );
}