import { useState, useCallback, useEffect, type ComponentType } from "react";
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
import { Field, FieldLabel } from "@/components/ui/field";
import { extractErrorMessage } from "@/lib/api";
import {
  listStartups,
  createStartup,
  updateStartup,
  deleteStartup,
  type StartupItem,
  type StartupPayload,
} from "@/lib/adminApi";
import {
  Building2,
  MapPin,
  Users as UsersIcon,
  Phone,
  Mail,
  Rocket,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { Badge } from "./shared";

function StartupMeta({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 text-neutral-400" />
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-neutral-400">{label}</p>
        <p className="truncate text-sm text-neutral-700">{value}</p>
      </div>
    </div>
  );
}

export function StartupsTab() {
  const emptyForm: StartupPayload = {
    name: "",
    tagline: "",
    industry: "",
    website: "",
    location: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    notes: "",
    isActive: true,
  };
  const [items, setItems] = useState<StartupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<StartupItem | null>(null);
  const [form, setForm] = useState<StartupPayload>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await listStartups());
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const startCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const startEdit = (item: StartupItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      tagline: item.tagline ?? "",
      industry: item.industry ?? "",
      website: item.website ?? "",
      location: item.location ?? "",
      contactName: item.contactName ?? "",
      contactEmail: item.contactEmail ?? "",
      contactPhone: item.contactPhone ?? "",
      foundedYear: item.foundedYear ?? undefined,
      notes: item.notes ?? "",
      isActive: item.isActive,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name?.trim()) {
      toast.error("Startup name is required");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateStartup(editing.id, form);
        toast.success("Startup updated");
      } else {
        await createStartup(form);
        toast.success("Startup added");
      }
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
      await load();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this startup?")) return;
    try {
      await deleteStartup(id);
      toast.success("Startup deleted");
      load();
    } catch (e) {
      toast.error(extractErrorMessage(e));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Startup Directory</h2>
          <p className="text-sm text-neutral-500">
            Add startup partners and keep their working details in one place.
          </p>
        </div>
        <Button onClick={startCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Startup
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? "Edit startup" : "Add startup"}</CardTitle>
            <CardDescription>
              Track the startup, contact owner, and any notes the admin team needs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>Name *</FieldLabel>
                <Input
                  value={form.name ?? ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel>Tagline</FieldLabel>
                <Input
                  value={form.tagline ?? ""}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel>Industry</FieldLabel>
                <Input
                  value={form.industry ?? ""}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel>Website</FieldLabel>
                <Input
                  value={form.website ?? ""}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel>Location</FieldLabel>
                <Input
                  value={form.location ?? ""}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel>Founded year</FieldLabel>
                <Input
                  type="number"
                  value={form.foundedYear ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      foundedYear: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
              </Field>
              <Field>
                <FieldLabel>Contact name</FieldLabel>
                <Input
                  value={form.contactName ?? ""}
                  onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel>Contact email</FieldLabel>
                <Input
                  value={form.contactEmail ?? ""}
                  onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel>Contact phone</FieldLabel>
                <Input
                  value={form.contactPhone ?? ""}
                  onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel>Status</FieldLabel>
                <select
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                  value={form.isActive ? "active" : "inactive"}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.value === "active" })
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </Field>
            </div>
            <Field>
              <FieldLabel>Notes</FieldLabel>
              <textarea
                className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={form.notes ?? ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                  setForm(emptyForm);
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : editing ? "Update Startup" : "Create Startup"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Rocket className="mx-auto h-8 w-8 text-neutral-300" />
            <p className="mt-3 text-sm font-medium text-neutral-900">No startups added yet</p>
            <p className="mt-1 text-sm text-neutral-500">
              Add startup partners so the admin team can manage their details here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-neutral-900">{item.name}</h3>
                      <Badge variant={item.isActive ? "green" : "gray"}>
                        {item.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {item.tagline && (
                      <p className="mt-1 text-sm text-neutral-500">{item.tagline}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => startEdit(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2 text-sm text-neutral-600 sm:grid-cols-2">
                  <StartupMeta icon={Building2} label="Industry" value={item.industry ?? "—"} />
                  <StartupMeta icon={MapPin} label="Location" value={item.location ?? "—"} />
                  <StartupMeta icon={UsersIcon} label="Contact" value={item.contactName ?? "—"} />
                  <StartupMeta icon={Phone} label="Phone" value={item.contactPhone ?? "—"} />
                  <StartupMeta icon={Mail} label="Email" value={item.contactEmail ?? "—"} />
                  <StartupMeta
                    icon={Rocket}
                    label="Founded"
                    value={item.foundedYear ? String(item.foundedYear) : "—"}
                  />
                </div>
                {item.website && (
                  <a
                    href={item.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex text-sm font-medium text-neutral-700 underline-offset-4 hover:text-neutral-900 hover:underline"
                  >
                    Visit website
                  </a>
                )}
                {item.notes && (
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
                    {item.notes}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
