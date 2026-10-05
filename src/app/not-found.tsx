import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
      <h2 className="text-3xl font-black text-white mb-2">404 - Table Not Found</h2>
      <p className="text-slate-400 mb-6 text-sm">The game room or page you are looking for does not exist.</p>
      <Link href="/">
        <Button>Return to Lobby</Button>
      </Link>
    </div>
  );
}
