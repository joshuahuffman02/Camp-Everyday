"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { SPRING_CONFIG, fadeInDown } from "@/lib/portal-constants";

interface PortalPageHeaderProps {
  icon: LucideIcon;
  iconGradient?: string;
  title: string;
  description: string;
  rightContent?: React.ReactNode;
}

export function PortalPageHeader({
  icon: Icon,
  iconGradient = "from-emerald-500 to-teal-600",
  title,
  description,
  rightContent,
}: PortalPageHeaderProps) {
  return (
    <motion.div
      initial={fadeInDown.initial}
      animate={fadeInDown.animate}
      transition={SPRING_CONFIG}
      className="flex items-center justify-between gap-4"
    >
      <div className="flex items-center gap-3">
        <div
          className={`h-12 w-12 rounded-xl bg-gradient-to-br ${iconGradient} flex items-center justify-center shadow-lg`}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>
      {rightContent && <div>{rightContent}</div>}
    </motion.div>
  );
}
