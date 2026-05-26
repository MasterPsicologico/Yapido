
"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .rdp-month_grid { width: 100% !important; border-collapse: collapse !important; }
        .rdp-week { display: grid !important; grid-template-columns: repeat(7, 1fr) !important; width: 100% !important; margin-top: 0.5rem !important; }
        .rdp-weekdays { display: grid !important; grid-template-columns: repeat(7, 1fr) !important; width: 100% !important; }
        .rdp-day { display: flex !important; align-items: center !important; justify-content: center !important; width: 100% !important; aspect-ratio: 1 !important; }
        .rdp-month_caption { margin-bottom: 1rem !important; display: flex !important; justify-content: center !important; align-items: center !important; }
      `}} />
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn("p-3 w-full", className)}
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
          month: "space-y-4 w-full",
          month_caption: "flex justify-center pt-1 relative items-center mb-4 rdp-month_caption",
          caption_label: "text-sm font-bold text-primary",
          nav: "space-x-1 flex items-center",
          button_previous: cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1 z-10"
          ),
          button_next: cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1 z-10"
          ),
          month_grid: "w-full border-collapse space-y-1 rdp-month_grid",
          weekdays: "flex w-full justify-between rdp-weekdays",
          weekday: "text-muted-foreground rounded-md w-full font-bold text-[0.7rem] uppercase text-center py-2",
          week: "flex w-full mt-2 justify-between rdp-week",
          day: "h-9 w-full text-center text-sm p-0 relative flex items-center justify-center rounded-lg transition-all focus-within:relative focus-within:z-20 hover:bg-accent hover:text-accent-foreground cursor-pointer rdp-day",
          day_button: cn(
            buttonVariants({ variant: "ghost" }),
            "h-full w-full p-0 font-normal aria-selected:opacity-100 hover:bg-transparent"
          ),
          range_end: "day-range-end",
          selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-lg",
          today: "bg-accent/20 text-accent font-bold border border-accent/30",
          outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
          disabled: "text-muted-foreground opacity-50",
          range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
          hidden: "invisible",
          ...classNames,
        }}
        components={{
          Chevron: ({ ...props }) => {
            if (props.orientation === 'left') return <ChevronLeft className="h-4 w-4" />
            return <ChevronRight className="h-4 w-4" />
          }
        }}
        {...props}
      />
    </>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
