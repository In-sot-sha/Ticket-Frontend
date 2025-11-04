import * as React from "react";
import { cn } from "../../lib/utils";

const Spinner = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn("flex items-center justify-center", className)} {...props}>
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
    </div>
  );
};

Spinner.displayName = "Spinner";

export { Spinner };