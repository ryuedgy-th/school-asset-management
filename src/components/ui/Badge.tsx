import React from "react";
import { cn } from "@/lib/utils";

type BadgeColor = "success" | "warning" | "error" | "info" | "default";

interface BadgeProps {
    color?: BadgeColor;
    children: React.ReactNode;
    className?: string;
}

const Badge: React.FC<BadgeProps> = ({
    color = "default",
    children,
    className,
}) => {
    const colorStyles = {
        success: "bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-400",
        warning: "bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-500/15 dark:text-amber-400",
        error: "bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-500/15 dark:text-rose-400",
        info: "bg-primary/10 text-primary/90 border border-primary/20 dark:bg-primary/80/15 dark:text-primary/70",
        default: "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-500/15 dark:text-slate-400",
    };

    return (
        <span
            className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                colorStyles[color],
                className
            )}
        >
            {children}
        </span>
    );
};

export default Badge;
