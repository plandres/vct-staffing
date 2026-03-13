"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Building2, User, FolderKanban, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface SearchResult {
  id: string;
  type: "company" | "member" | "program";
  label: string;
  detail?: string;
  href: string;
}

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }

    const supabase = createClient();
    const like = `%${q}%`;

    const [companiesRes, membersRes, programsRes] = await Promise.all([
      supabase
        .from("portfolio_companies")
        .select("id, name, sector, geography")
        .or(`name.ilike.${like},sector.ilike.${like},geography.ilike.${like},deal_partner.ilike.${like}`)
        .limit(5),
      supabase
        .from("profiles")
        .select("id, full_name, initials, role")
        .eq("is_active", true)
        .or(`full_name.ilike.${like},initials.ilike.${like},email.ilike.${like}`)
        .limit(5),
      supabase
        .from("program_categories")
        .select("id, name, type")
        .ilike("name", like)
        .limit(5),
    ]);

    const items: SearchResult[] = [];

    companiesRes.data?.forEach((c) =>
      items.push({
        id: c.id,
        type: "company",
        label: c.name,
        detail: [c.sector, c.geography].filter(Boolean).join(" — "),
        href: `/companies/${c.id}`,
      })
    );

    membersRes.data?.forEach((m) =>
      items.push({
        id: m.id,
        type: "member",
        label: `${m.initials ?? ""} — ${m.full_name}`,
        detail: m.role.replace("_", " "),
        href: `/staffing/${m.id}`,
      })
    );

    programsRes.data?.forEach((p) =>
      items.push({
        id: p.id,
        type: "program",
        label: p.name,
        detail: p.type === "fundamental" ? "Fundamental" : "Programme",
        href: `/programs`,
      })
    );

    setResults(items);
    setSelectedIdx(0);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => search(query), 200);
    return () => clearTimeout(timeout);
  }, [query, search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut: Ctrl+K / Cmd+K to focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIdx]) {
      e.preventDefault();
      router.push(results[selectedIdx].href);
      setOpen(false);
      setQuery("");
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const icons = {
    company: <Building2 className="h-4 w-4 text-muted-foreground" />,
    member: <User className="h-4 w-4 text-muted-foreground" />,
    program: <FolderKanban className="h-4 w-4 text-muted-foreground" />,
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Rechercher... (Ctrl+K)"
          className="w-48 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-md border bg-card shadow-lg z-50 max-h-80 overflow-y-auto">
          {results.map((result, i) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => {
                router.push(result.href);
                setOpen(false);
                setQuery("");
              }}
              className={`flex w-full items-center gap-3 px-3 py-2 text-sm text-left transition-colors ${
                i === selectedIdx ? "bg-accent" : "hover:bg-accent/50"
              }`}
            >
              {icons[result.type]}
              <div className="flex-1 overflow-hidden">
                <p className="truncate font-medium">{result.label}</p>
                {result.detail && (
                  <p className="truncate text-xs text-muted-foreground">{result.detail}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {open && query.length >= 2 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-md border bg-card shadow-lg z-50 p-4 text-center text-sm text-muted-foreground">
          Aucun résultat pour &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  );
}
