export function Card({ className, children }) {
  return (
    <div className={`bg-card text-card-foreground rounded-lg border shadow-sm ${className || ''}`}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }) {
  return <div className={`flex space-y-1.5 p-4 ${className || ''}`}>{children}</div>;
}

export function CardTitle({ className, children }) {
  return <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className || ''}`}>{children}</h3>;
}

export function CardDescription({ className, children }) {
  return <p className={`text-sm text-muted-foreground ${className || ''}`}>{children}</p>;
}

export function CardContent({ className, children }) {
  return <div className={`p-6 pt-4 ${className || ''}`}>{children}</div>;
}

export function CardFooter({ className, children }) {
  return <div className={`flex items-center p-6 pt-0 ${className || ''}`}>{children}</div>;
}