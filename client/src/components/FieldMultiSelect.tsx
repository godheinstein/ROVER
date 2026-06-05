import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronsUpDown } from "lucide-react";
import { FIELD_GROUPS, type RobotField } from "@/lib/robotFields";

interface Props {
  fields: RobotField[]; // fields available to choose from
  selected: string[]; // selected field keys
  onChange: (keys: string[]) => void;
  label?: string;
}

export default function FieldMultiSelect({ fields, selected, onChange, label = "Criteria" }: Props) {
  const toggle = (key: string, checked: boolean) => {
    onChange(checked ? [...selected, key] : selected.filter((k) => k !== key));
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-between min-w-[220px]">
            {label} ({selected.length} selected)
            <ChevronsUpDown className="h-4 w-4 ml-2 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-sm font-medium">{label}</span>
            <div className="flex gap-2">
              <button
                className="text-xs text-blue-600 hover:underline"
                onClick={() => onChange(fields.map((f) => f.key))}
              >
                All
              </button>
              <button className="text-xs text-slate-500 hover:underline" onClick={() => onChange([])}>
                None
              </button>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto p-2">
            {FIELD_GROUPS.map((group) => {
              const groupFields = fields.filter((f) => f.group === group);
              if (groupFields.length === 0) return null;
              return (
                <div key={group} className="mb-2">
                  <div className="text-xs font-semibold text-slate-500 px-1 py-1">{group}</div>
                  {groupFields.map((f) => (
                    <label
                      key={f.key}
                      className="flex items-center gap-2 text-sm cursor-pointer rounded px-1 py-1 hover:bg-slate-100"
                    >
                      <Checkbox
                        checked={selected.includes(f.key)}
                        onCheckedChange={(c) => toggle(f.key, c === true)}
                      />
                      <span>
                        {f.label}
                        {f.unit ? <span className="text-slate-400"> ({f.unit})</span> : null}
                        {f.format !== "number" ? (
                          <span className="text-slate-400 text-xs"> · table</span>
                        ) : null}
                      </span>
                    </label>
                  ))}
                </div>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
