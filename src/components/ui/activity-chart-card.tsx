"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ChevronDown, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface ActivityDataPoint {
  day: string;
  value: number;
}

interface ActivityChartCardProps {
  title?: string;
  totalValue: string;
  trendLabel?: string;
  data: ActivityDataPoint[];
  className?: string;
  dropdownOptions?: string[];
  onRangeChange?: (range: string) => void;
}

export const ActivityChartCard = ({
  title = "Activity",
  totalValue,
  trendLabel = "+12% from last week",
  data,
  className,
  dropdownOptions = ["Weekly", "Monthly", "Yearly"],
  onRangeChange,
}: ActivityChartCardProps) => {
  const [selectedRange, setSelectedRange] = React.useState(
    dropdownOptions[0] || ""
  );

  const maxValue = React.useMemo(() => {
    return data.reduce((max, item) => (item.value > max ? item.value : max), 0);
  }, [data]);

  const chartVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const barVariants = {
    hidden: { scaleY: 0, opacity: 0, transformOrigin: "bottom" },
    visible: {
      scaleY: 1,
      opacity: 1,
      transformOrigin: "bottom",
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  };

  const handleRangeChange = (option: string) => {
    setSelectedRange(option);
    onRangeChange?.(option);
  };

  return (
    <Card
      className={cn("w-full max-w-md", className)}
      aria-labelledby="activity-card-title"
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle id="activity-card-title" className="text-base">{title}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1 text-sm"
                aria-haspopup="true"
              >
                {selectedRange}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {dropdownOptions.map((option) => (
                <DropdownMenuItem
                  key={option}
                  onSelect={() => handleRangeChange(option)}
                >
                  {option}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 min-w-0">
          <div className="flex flex-col shrink-0">
            <p className="text-5xl font-bold tracking-tighter text-foreground">
              {totalValue}
            </p>
            <CardDescription className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              {trendLabel}
            </CardDescription>
          </div>

          <motion.div
            key={selectedRange}
            className="flex h-28 w-full min-w-0 items-end gap-1.5 overflow-hidden"
            variants={chartVariants}
            initial="hidden"
            animate="visible"
            aria-label="Activity chart"
          >
            {data.map((item, index) => (
              <div
                key={index}
                className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
                role="presentation"
              >
                <motion.div
                  className="w-full max-w-[32px] min-w-[6px] rounded-md bg-primary mx-auto"
                  style={{
                    height: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
                    minHeight: item.value > 0 ? '4px' : '0px',
                  }}
                  variants={barVariants}
                  aria-label={`${item.day}: ${item.value}`}
                />
                <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                  {item.day}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
};
