import React, { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Command } from "cmdk";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "../../lib/utils";

export interface ComboboxOption {
  label: string;
  value: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  onSelect: (option: ComboboxOption) => void;
}

const Combobox: React.FC<ComboboxProps> = ({ options, placeholder = "Wybierz...", disabled, isLoading, onSelect }) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string>("");

  const selected = options.find((o) => o.value === value);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "w-full border rounded px-3 py-2 flex items-center justify-between text-left bg-white focus:outline-none focus:ring-2 focus:ring-primary/50",
            disabled && "opacity-60 cursor-not-allowed"
          )}
        >
          <span className={cn(!selected && "text-gray-500")}>{selected ? selected.label : placeholder}</span>
          {isLoading ? (
            <svg className="ml-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
          )}
        </button>
      </Popover.Trigger>
      <Popover.Content className="z-20 w-[var(--radix-popover-trigger-width)] p-0 bg-white border rounded shadow" align="start">
        <Command loop>
          <Command.Input placeholder="Szukaj..." className="w-full border-b px-3 py-2 outline-none" />
          <Command.List className="max-h-60 overflow-auto">
            {options.length === 0 && <Command.Empty className="p-3 text-sm text-gray-500">Brak wyników.</Command.Empty>}
            {options.map((opt) => (
              <Command.Item
                key={opt.value}
                value={opt.label}
                onSelect={() => {
                  setValue(opt.value);
                  onSelect(opt);
                  setOpen(false);
                }}
                className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-100"
              >
                {opt.label}
                {value === opt.value && <Check className="h-4 w-4" />}
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </Popover.Content>
    </Popover.Root>
  );
};

export default Combobox; 