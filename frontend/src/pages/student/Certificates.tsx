import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Award,
  ExternalLink,
  Trash2,
  Pencil,
  AlertCircle,
  ShieldCheck,
  Building2,
  Calendar,
  Link as LinkIcon,
} from "lucide-react";
import { StudentLayout } from "@/components/shared/StudentLayout";
import { extractErrorMessage } from "@/lib/api";
import {
  listCertificates,
  createCertificate,
  updateCertificate,
  deleteCertificate,
  uploadCertificate,
  type Certificate,
} from "@/lib/studentApi";
import { validateFileSize } from "@/lib/fileUpload";

export function Certificates() {
  const [items, setItems] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listCertificates();
      setItems(data.items);
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this certificate?")) return;
    try {
      await deleteCertificate(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Certificate deleted.");
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  return (
    <StudentLayout
      title="Certificates"
      subtitle="Manage your professional and academic certifications. These will be visible to recruiters."
    >
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => {
            setEditingId(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          <Plus className="h-4 w-4" />
          Add Certificate
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 py-24 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
            <Award className="h-6 w-6 text-neutral-400" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-neutral-900">
            No certificates yet
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            Add your professional certifications to strengthen your profile.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {items.map((item) => (
            <CertificateCard
              key={item.id}
              item={item}
              onEdit={() => {
                setEditingId(item.id);
                setIsModalOpen(true);
              }}
              onDelete={() => handleDelete(item.id)}
            />
          ))}
        </div>
      )}

      {isModalOpen && (
        <CertificateModal
          id={editingId}
          initialData={items.find((i) => i.id === editingId)}
          onClose={() => setIsModalOpen(false)}
          onSuccess={(item) => {
            if (editingId) {
              setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
            } else {
              setItems((prev) => [item, ...prev]);
            }
            setIsModalOpen(false);
          }}
        />
      )}
    </StudentLayout>
  );
}

function CertificateCard({
  item,
  onEdit,
  onDelete,
}: {
  item: Certificate;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white">
          <Award className="h-5 w-5" />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="rounded-md p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-900"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="rounded-md p-1.5 text-neutral-400 transition hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 flex-1">
        <h4 className="font-semibold leading-tight text-neutral-900">
          {item.title}
        </h4>
        <div className="mt-2 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-neutral-600">
            <Building2 className="h-3.5 w-3.5" />
            <span>{item.issuingOrg}</span>
          </div>
          {item.issueDate && (
            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                Issued: {new Date(item.issueDate).toLocaleDateString()}
              </span>
            </div>
          )}
          {item.credentialId && (
            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>ID: {item.credentialId}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-4">
        <div className="flex items-center gap-2">
          {item.isVerified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
              <ShieldCheck className="h-3 w-3" />
              Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-0.5 text-[10px] font-medium text-yellow-700 ring-1 ring-inset ring-yellow-600/20">
              <AlertCircle className="h-3 w-3" />
              Pending
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {item.credentialUrl && (
            <a
              href={item.credentialUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 py-1 text-[10px] font-medium text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900"
            >
              <LinkIcon className="h-3 w-3" />
              Credential
            </a>
          )}
          {item.certificateUrl && (
            <a
              href={item.certificateUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-md bg-neutral-900 px-2 py-1 text-[10px] font-medium text-white transition hover:bg-neutral-800"
            >
              <ExternalLink className="h-3 w-3" />
              View
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function CertificateModal({
  id,
  initialData,
  onClose,
  onSuccess,
}: {
  id: string | null;
  initialData?: Certificate;
  onClose: () => void;
  onSuccess: (item: Certificate) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: initialData?.title || "",
    issuingOrg: initialData?.issuingOrg || "",
    issueDate: initialData?.issueDate ? initialData.issueDate.split("T")[0] : "",
    expiryDate: initialData?.expiryDate ? initialData.expiryDate.split("T")[0] : "",
    credentialId: initialData?.credentialId || "",
    credentialUrl: initialData?.credentialUrl || "",
    certificateUrl: initialData?.certificateUrl || "",
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateFileSize(file)) return;

    setUploading(true);
    try {
      const { url } = await uploadCertificate(file);
      setForm((prev) => ({ ...prev, certificateUrl: url }));
      toast.success("Certificate uploaded.");
    } catch (e) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        issueDate: form.issueDate || undefined,
        expiryDate: form.expiryDate || undefined,
      };
      const res = id
        ? await updateCertificate(id, payload)
        : await createCertificate(payload);
      onSuccess(res.certificate);
      toast.success(id ? "Certificate updated." : "Certificate added.");
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-neutral-900">
          {id ? "Edit Certificate" : "Add Certificate"}
        </h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-neutral-500">
              Certificate Title
            </label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1.5 h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              placeholder="e.g. AWS Certified Solutions Architect"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-neutral-500">
              Issuing Organization
            </label>
            <input
              required
              value={form.issuingOrg}
              onChange={(e) => setForm({ ...form, issuingOrg: e.target.value })}
              className="mt-1.5 h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              placeholder="e.g. Amazon Web Services"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-neutral-500">
                Issue Date
              </label>
              <input
                type="date"
                value={form.issueDate}
                onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                className="mt-1.5 h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-neutral-500">
                Expiry Date
              </label>
              <input
                type="date"
                value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                className="mt-1.5 h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-neutral-500">
                Credential ID
              </label>
              <input
                value={form.credentialId}
                onChange={(e) => setForm({ ...form, credentialId: e.target.value })}
                className="mt-1.5 h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-neutral-500">
                Credential URL
              </label>
              <input
                type="url"
                value={form.credentialUrl}
                onChange={(e) => setForm({ ...form, credentialUrl: e.target.value })}
                className="mt-1.5 h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                placeholder="https://..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-neutral-500">
              Certificate File (PDF)
            </label>
            <div className="mt-1.5 flex items-center gap-3">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="modal-file"
              />
              <label
                htmlFor="modal-file"
                className="flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm font-medium text-neutral-700 transition hover:border-neutral-900 hover:bg-white"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                {form.certificateUrl ? "Change File" : "Upload Certificate"}
              </label>
              {form.certificateUrl && (
                <a
                  href={form.certificateUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900 text-white"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-neutral-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="inline-flex items-center gap-2 rounded-md bg-neutral-900 px-6 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {id ? "Update Certificate" : "Add Certificate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
