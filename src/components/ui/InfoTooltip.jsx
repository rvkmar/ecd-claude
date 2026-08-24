import * as Tooltip from "@radix-ui/react-tooltip";
import { Info } from "lucide-react";

export default function InfoTooltip({ content }) {
    return (
        <Tooltip.Provider delayDuration={200}>
            <Tooltip.Root>
                <Tooltip.Trigger asChild>
                    <span className="inline-flex items-center ml-1 cursor-help text-slate-400 hover:text-slate-600">
                        <Info size={14} />
                    </span>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                    <Tooltip.Content
                        className="max-w-xs rounded-md bg-slate-900 px-3 py-2 text-xs text-white shadow-lg"
                        side="top"
                        align="start"
                    >
                        {content}
                        <Tooltip.Arrow className="fill-slate-900" />
                    </Tooltip.Content>
                </Tooltip.Portal>
            </Tooltip.Root>
        </Tooltip.Provider>
    );
}
