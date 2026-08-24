// CognitiveAttributeSelector.jsx

import { useState } from "react";
import { ChevronDown, ChevronRight, ChevronUp } from "lucide-react";
import { cognitiveAttributeOntology }
    from "../components/vocabulary/cognitiveAttributeOntology";

export default function CognitiveAttributeSelector({
    value,
    onChange
}) {

    const [open, setOpen] = useState(false);
    const [domainOpen, setDomainOpen] = useState(null);
    const [categoryOpen, setCategoryOpen] = useState(null);

    return (

        <div className="space-y-1.5">

            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Cognitive Attribute
            </label>

            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-left text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
            >
                <span className={value ? "text-slate-900" : "text-slate-400"}>
                    {value || "Select cognitive attribute"}
                </span>
                {open ? (
                    <ChevronUp size={16} strokeWidth={2} className="text-slate-400 shrink-0" />
                ) : (
                    <ChevronDown size={16} strokeWidth={2} className="text-slate-400 shrink-0" />
                )}
            </button>

            {open && (

                <div className="rounded-md border border-slate-200 bg-white shadow-sm max-h-72 overflow-y-auto p-3">

                    {cognitiveAttributeOntology.domains.map(domain => (

                        <div key={domain.id}>

                            <div
                                className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 cursor-pointer py-1.5"
                                onClick={() => setDomainOpen(
                                    domainOpen === domain.id ? null : domain.id
                                )}
                            >
                                {domainOpen === domain.id ? (
                                    <ChevronDown size={14} strokeWidth={2} className="text-slate-400 shrink-0" />
                                ) : (
                                    <ChevronRight size={14} strokeWidth={2} className="text-slate-400 shrink-0" />
                                )}
                                {domain.name}
                            </div>

                            {domainOpen === domain.id && (

                                <div className="ml-3">

                                    {domain.categories.map(category => (

                                        <div key={category.id}>

                                            <div
                                                className="flex items-center gap-1.5 text-sm text-slate-700 cursor-pointer py-1.5"
                                                onClick={() => setCategoryOpen(
                                                    categoryOpen === category.id
                                                        ? null
                                                        : category.id
                                                )}
                                            >
                                                {categoryOpen === category.id ? (
                                                    <ChevronDown size={14} strokeWidth={2} className="text-slate-400 shrink-0" />
                                                ) : (
                                                    <ChevronRight size={14} strokeWidth={2} className="text-slate-400 shrink-0" />
                                                )}
                                                {category.name}
                                            </div>

                                            {categoryOpen === category.id && (

                                                <div className="ml-3 space-y-1">

                                                    {category.attributes.map(attr => (

                                                        <div
                                                            key={attr.id}
                                                            className="text-sm text-slate-600 cursor-pointer hover:bg-slate-100 hover:text-slate-900 px-2 py-1 rounded-md transition"
                                                            onClick={() => {

                                                                onChange(attr.label);
                                                                setOpen(false);

                                                            }}
                                                        >
                                                            {attr.label}
                                                        </div>

                                                    ))}

                                                </div>

                                            )}

                                        </div>

                                    ))}

                                </div>

                            )}

                        </div>

                    ))}

                </div>

            )}

        </div>

    );

}