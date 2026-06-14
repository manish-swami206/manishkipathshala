import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
      <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-2">
        <span className="text-4xl font-black text-primary">404</span>
      </div>
      <h1 className="text-2xl font-extrabold text-foreground">Page Not Found</h1>
      <p className="text-muted-foreground text-sm max-w-xs">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors"
      >
        Go Home
      </Link>
    </div>
  );
}
