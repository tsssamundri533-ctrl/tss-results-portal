
'use client';

import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  trend?: {
    value: number
    label: string
  }
  className?: string
  iconClassName?: string
  delay?: number
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  className,
  iconClassName,
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className={cn("overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow duration-300", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <h3 className="mt-1 text-2xl font-bold tracking-tight">{value}</h3>
            </div>
            <div className={cn("rounded-2xl bg-primary/10 p-3", iconClassName)}>
              <Icon className="h-6 w-6 text-primary" />
            </div>
          </div>
          {(description || trend) && (
            <div className="mt-4 flex items-center space-x-2">
              {trend && (
                <span
                  className={cn(
                    "text-xs font-semibold",
                    trend.value > 0 ? "text-emerald-600" : "text-rose-600"
                  )}
                >
                  {trend.value > 0 ? "+" : ""}
                  {trend.value}%
                </span>
              )}
              {description && (
                <p className="text-xs text-muted-foreground font-medium">{description}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
