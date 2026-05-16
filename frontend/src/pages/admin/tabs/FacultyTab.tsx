import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { extractErrorMessage } from "@/lib/api";
import {
  listFaculty,
  createFaculty,
  updateFaculty,
  setUserStatus,
  type FacultyListItem,
  type CreateFacultyPayload,
} from "@/lib/adminApi";
import {
  DEPARTMENT_LABELS,
  departmentLabel,
  type Department,
} from "@/lib/studentApi";
import { DEPARTMENTS } from "./shared";

const emptyFacultyForm: CreateFacultyPayload = {
  fullName: "",
  emailId: "",
  contactNo: "",
  department: "COMPUTER",
  isHOD: false,
};

export function FacultyTab() {
  const navigate = useNavigate();
  const [items, setItems] = useState<FacultyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateFacultyPayload>(emptyFacultyForm);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listFaculty());
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.emailId || !form.contactNo) {
      toast.error("Fill all required fields");
      return;
    }
    setSaving(true);
    try {
      await createFaculty(form);
      toast.success("Faculty created. Credentials emailed.");
      setShowForm(false);
      setForm(emptyFacultyForm);
      await refresh();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleHOD = async (item: FacultyListItem) => {
    setBusyId(item.id);
    try {
      await updateFaculty(item.id, { isHOD: !item.isHOD });
      toast.success(item.isHOD ? "Removed as HOD" : "Marked as HOD");
      await refresh();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleStatus = async (item: FacultyListItem) => {
    const next = !item.isActive;
    if (!window.confirm(next ? "Activate this account?" : "Deactivate this account?")) return;
    setBusyId(item.id);
    try {
      await setUserStatus(item.id, next);
      toast.success(`Account ${next ? "activated" : "deactivated"}`);
      await refresh();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "Add Faculty"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Faculty Account</CardTitle>
            <CardDescription>
              A temporary password is auto-generated and emailed to the faculty member.
            </CardDescription>
          </CardHeader>
          <CardContent className="py-2">
            <form onSubmit={handleCreate}>
              <FieldGroup>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Full Name</FieldLabel>
                    <Input
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Email</FieldLabel>
                    <Input
                      type="email"
                      value={form.emailId}
                      onChange={(e) => setForm({ ...form, emailId: e.target.value })}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Contact No</FieldLabel>
                    <Input
                      value={form.contactNo}
                      onChange={(e) => setForm({ ...form, contactNo: e.target.value })}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Department</FieldLabel>
                    <select
                      className="h-9 rounded-md border bg-background px-3 text-sm"
                      value={form.department}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          department: e.target.value as CreateFacultyPayload["department"],
                        })
                      }
                    >
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>
                          {DEPARTMENT_LABELS[d as Department] ?? d}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field>
                    <FieldLabel className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.isHOD ?? false}
                        onChange={(e) => setForm({ ...form, isHOD: e.target.checked })}
                      />
                      Mark as HOD
                    </FieldLabel>
                  </Field>
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? "Creating..." : "Create Faculty"}
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Faculty Directory</CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          {loading ? (
            <p className="text-sm text-muted-foreground py-4">Loading faculty...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No faculty yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground border-b">
                  <tr>
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Contact</th>
                    <th className="py-2 pr-4">Department</th>
                    <th className="py-2 pr-4">Role</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((f) => (
                    <tr key={f.id} className="border-b last:border-b-0">
                      <td className="py-3 pr-4 font-medium">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/faculty/${f.id}`)}
                          className="text-left text-neutral-900 hover:text-neutral-600 hover:underline underline-offset-4"
                        >
                          {f.fullName}
                        </button>
                      </td>
                      <td className="py-3 pr-4">{f.emailId}</td>
                      <td className="py-3 pr-4">{f.contactNo ?? "—"}</td>
                      <td className="py-3 pr-4">
                        {departmentLabel(f.department) || "—"}
                      </td>
                      <td className="py-3 pr-4">
                        {f.isHOD ? (
                          <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                            HOD
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Faculty</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            f.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {f.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleHOD(f)}
                          disabled={busyId === f.id}
                        >
                          {f.isHOD ? "Unset HOD" : "Set HOD"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleStatus(f)}
                          disabled={busyId === f.id}
                        >
                          {f.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
