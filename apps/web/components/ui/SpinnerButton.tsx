import { type VariantProps } from "class-variance-authority";
import { Button, buttonVariants } from "./button";
import { Spinner } from "./spinner";

function SpinnerButton({
  loading,
  children,
  inactiveNode,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading: boolean;
    inactiveNode?: React.ReactNode;
  }) {
  return (
    <Button
      {...props}
      disabled={loading || props.disabled}
      aria-disabled={loading}
    >
      {loading ? <Spinner /> : inactiveNode}
      {children}
    </Button>
  );
}

export { SpinnerButton };
